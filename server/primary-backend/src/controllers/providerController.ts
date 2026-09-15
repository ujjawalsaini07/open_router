import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/dbConfig.ts';
import { z } from 'zod';
import { buildPaginationMeta, paginationSchema } from '../utils/paginationUtils.ts';


const getAllProvidersSchema = paginationSchema;


export const getAllProviders = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try{
       const parsedQuery = getAllProvidersSchema.safeParse(req.query);
       if(!parsedQuery.success){
        return res.status(400).json({ error: 'Invalid query parameters' });
       }

       const { page, pageSize } = parsedQuery.data;

       const providers = await prisma.provider.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
       });


        const totalProviders = await prisma.provider.count();

        return res.status(200).json({
            items: providers,
            pagination: buildPaginationMeta(page, pageSize, totalProviders)
        });



    }
    catch(error){
        next(error);
    }
}

const getProviderByIdSchema = z.object({
    id: z.coerce.number().int()
});

export const getProviderById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {

    try{
        const parsedParams = getProviderByIdSchema.safeParse(req.params);
        if(!parsedParams.success) {
            return res.status(400).json({ error: 'Invalid provider ID' });
        }

        const { id } = parsedParams.data;


        const provider = await prisma.provider.findUnique({
            where: { id }
        });

        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        return res.status(200).json(provider);

    }catch(error){
        next(error);
    }

}