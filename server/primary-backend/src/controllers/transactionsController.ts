import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/dbConfig.ts';
import { z } from 'zod';


const addCreditSchema = z.object({
    userId: z.number(),
    amount: z.number().positive()
});

export const addCredit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!addCreditSchema.safeParse(req.body).success) {
            return res.status(400).json({ msg: 'Invalid request body' });
        }

        const { userId, amount } = req.body;

        if (userId !== req.user?.userId) {
            return res.status(403).json({ msg: 'Unauthorized' });
        }
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

        res.status(200).json({ msg: 'Credit added successfully', transaction, updatedUser });
    } catch (error) {
        next(error);
    }
};