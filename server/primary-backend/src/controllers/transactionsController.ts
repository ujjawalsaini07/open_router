import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/dbConfig.ts';
import { z } from 'zod';
import { buildPaginationMeta, paginationSchema } from '../utils/paginationUtils.ts';


const addCreditSchema = z.object({
    amount: z.number().positive()
});

export const addCredit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!addCreditSchema.safeParse(req.body).success) {
            return res.status(400).json({ msg: 'Invalid request body' });
        }

        const { amount } = req.body;
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const [transaction, updatedUser] = await prisma.$transaction([
            prisma.onrampTransaction.create({
                data: { userId, amount, status: 'completed' },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: amount } },
            }),
        ]);
        const updatedCredits = updatedUser.credits;
        res.status(200).json({ msg: 'Credit added successfully', transaction, updatedCredits });
    } catch (error) {
        next(error);
    }
};

const getPaymentHistorySchema = paginationSchema;

export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parsed = getPaymentHistorySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ msg: 'Invalid query parameters' });
        }
        const { page, pageSize } = parsed.data;

        const where = { userId: req.user!.userId };

        const [transactions, totalTransactions] = await prisma.$transaction([
            prisma.onrampTransaction.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.onrampTransaction.count({ where })
        ]);

        return res.status(200).json({
            items: transactions,
            pagination: buildPaginationMeta(page, pageSize, totalTransactions)
        });
    } catch (error) {
        next(error);
    }
};