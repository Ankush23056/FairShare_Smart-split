import { Request, Response } from 'express';
import { simplifyDebts } from '../utils/simplifyDebts';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const groupId = req.params.groupId;

    const [expenses] = await db.query<any[]>('SELECT * FROM expenses WHERE groupId = ?', [groupId]);

    for (const expense of expenses) {
      const [splits] = await db.query<any[]>(
        'SELECT userId, amount FROM expense_splits WHERE expenseId = ?',
        [expense.id]
      );
      expense.splits = splits;
    }

    res.json(expenses);
  } catch (error: any) {
    console.error('getExpenses error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const groupId = req.params.groupId;
    const { description, amount, paidBy, category, splits } = req.body;

    const newExpenseId = randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.query(
      'INSERT INTO expenses (id, groupId, description, amount, paidById, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newExpenseId, groupId, description, amount, paidBy, category, now, now]
    );

    for (const split of splits) {
      const splitId = randomUUID();
      await db.query(
        'INSERT INTO expense_splits (id, expenseId, userId, amount) VALUES (?, ?, ?, ?)',
        [splitId, newExpenseId, split.userId, split.amount]
      );
    }

    res.status(201).json({ id: newExpenseId, description, amount, paidBy, category, splits });
  } catch (error: any) {
    console.error('createExpense error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const createSettlement = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { payerId, payeeId, amount } = req.body;

    const newSettlementId = randomUUID();
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.query(
      'INSERT INTO settlements (id, payerId, payeeId, amount, date) VALUES (?, ?, ?, ?, ?)',
      [newSettlementId, payerId, payeeId, amount, date]
    );

    res.status(201).json({ id: newSettlementId, payerId, payeeId, amount, date });
  } catch (error: any) {
    console.error('createSettlement error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const getBalances = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const groupId = req.params.groupId;

    const [expenses] = await db.query<any[]>('SELECT * FROM expenses WHERE groupId = ?', [groupId]);

    // Fetch members of the group for settlements filtering
    const [members] = await db.query<any[]>('SELECT userId FROM group_members WHERE groupId = ?', [groupId]);
    const memberIds = members.map((m: any) => m.userId);

    // Only fetch settlements between members of this group
    let settlements: any[] = [];
    if (memberIds.length >= 2) {
      const placeholders = memberIds.map(() => '?').join(',');
      const [rows] = await db.query<any[]>(
        `SELECT * FROM settlements WHERE payerId IN (${placeholders}) AND payeeId IN (${placeholders})`,
        [...memberIds, ...memberIds]
      );
      settlements = rows;
    }

    // Calculate net balances
    const balances: Record<string, number> = {};

    for (const exp of expenses) {
      // Person who paid gets positive balance (they are owed)
      balances[exp.paidById] = (balances[exp.paidById] || 0) + Number(exp.amount);

      const [splits] = await db.query<any[]>(
        'SELECT userId, amount FROM expense_splits WHERE expenseId = ?',
        [exp.id]
      );

      // Everyone in splits owes their share (negative)
      for (const split of splits) {
        balances[split.userId] = (balances[split.userId] || 0) - Number(split.amount);
      }
    }

    for (const settlement of settlements) {
      // Payer reduces what they owe (positive effect for payer)
      balances[settlement.payerId] = (balances[settlement.payerId] || 0) + Number(settlement.amount);
      // Payee receives less (reduces what they are owed)
      balances[settlement.payeeId] = (balances[settlement.payeeId] || 0) - Number(settlement.amount);
    }

    const simplifiedDebts = simplifyDebts(balances);

    const formattedSettlements = settlements.map(s => ({
      id: s.id,
      payerId: s.payerId,
      payeeId: s.payeeId,
      amount: Number(s.amount),
      date: s.date,
    }));

    res.json({ balances, simplifiedDebts, settlements: formattedSettlements });
  } catch (error: any) {
    console.error('getBalances error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
