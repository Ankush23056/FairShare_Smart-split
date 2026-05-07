import { Request, Response } from 'express';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

export const getGroups = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = (req as any).user?.id;

    // Get all groups where user is a member
    const [groups] = await db.query<any[]>(`
      SELECT g.*,
             (SELECT SUM(amount) FROM expenses WHERE groupId = g.id) as totalAmount
      FROM groups_table g
      JOIN group_members gm ON g.id = gm.groupId
      WHERE gm.userId = ?
    `, [userId]);

    // For each group, fetch members with their names from users table
    for (const group of groups) {
      const [members] = await db.query<any[]>(`
        SELECT u.id, u.name
        FROM group_members gm
        JOIN users u ON u.id = gm.userId
        WHERE gm.groupId = ?
      `, [group.id]);
      group.members = members;
      group.totalAmount = Number(group.totalAmount) || 0;
    }

    res.json(groups);
  } catch (error: any) {
    console.error('getGroups error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { name, description, members } = req.body;
    const newGroupId = randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.query(
      'INSERT INTO groups_table (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [newGroupId, name, now, now]
    );

    for (const member of members) {
      const memberId = randomUUID();
      await db.query(
        'INSERT INTO group_members (id, groupId, userId, joinedAt) VALUES (?, ?, ?, ?)',
        [memberId, newGroupId, member.id, now]
      );
    }

    // Fetch member details to return proper names
    const [memberDetails] = await db.query<any[]>(`
      SELECT u.id, u.name
      FROM group_members gm
      JOIN users u ON u.id = gm.userId
      WHERE gm.groupId = ?
    `, [newGroupId]);

    res.status(201).json({ id: newGroupId, name, description, totalAmount: 0, members: memberDetails });
  } catch (error: any) {
    console.error('createGroup error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = (req as any).user?.id;
    const groupId = req.params.id;

    const [groups] = await db.query<any[]>('SELECT * FROM groups_table WHERE id = ?', [groupId]);
    const group = groups[0];
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const [members] = await db.query<any[]>(`
      SELECT u.id, u.name
      FROM group_members gm
      JOIN users u ON u.id = gm.userId
      WHERE gm.groupId = ?
    `, [groupId]);

    const isMember = members.some(m => m.id === userId);
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    const [totals] = await db.query<any[]>('SELECT SUM(amount) as total FROM expenses WHERE groupId = ?', [groupId]);

    res.json({ ...group, members, totalAmount: Number(totals[0]?.total) || 0 });
  } catch (error: any) {
    console.error('getGroupById error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const getGroupAnalytics = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const groupId = req.params.id;

    // Real spending by category
    const [byCategory] = await db.query<any[]>(`
      SELECT category as name, SUM(amount) as value
      FROM expenses WHERE groupId = ? AND category IS NOT NULL
      GROUP BY category ORDER BY value DESC
    `, [groupId]);

    const [totals] = await db.query<any[]>('SELECT SUM(amount) as total FROM expenses WHERE groupId = ?', [groupId]);
    const totalSpent = Number(totals[0]?.total) || 0;

    // Top spender
    const [topSpenders] = await db.query<any[]>(`
      SELECT u.name, SUM(e.amount) as amount
      FROM expenses e JOIN users u ON u.id = e.paidById
      WHERE e.groupId = ?
      GROUP BY e.paidById, u.name ORDER BY amount DESC LIMIT 1
    `, [groupId]);

    // Spending trends (by date)
    const [trends] = await db.query<any[]>(`
      SELECT DATE(date) as date, SUM(amount) as amount
      FROM expenses WHERE groupId = ?
      GROUP BY DATE(date) ORDER BY date
    `, [groupId]);

    res.json({
      totalSpent,
      topSpender: topSpenders[0] ? { name: topSpenders[0].name, amount: Number(topSpenders[0].amount) } : null,
      mostExpensiveCategory: byCategory[0]?.name || null,
      spendingByCategory: byCategory.map(r => ({ name: r.name, value: Number(r.value) })),
      spendingTrends: trends.map(r => ({ date: String(r.date).slice(0, 10), amount: Number(r.amount) })),
    });
  } catch (error: any) {
    console.error('getGroupAnalytics error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
