import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!title) {
      throw new AppError('Please, inform a title!');
    }
    if (!value || value < 0) {
      throw new AppError('Invalid value!');
    }
    if (!category) {
      throw new AppError('Please, inform a category!');
    }
    if (!type) {
      throw new AppError('Please, inform a type!');
    }
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid type');
    }

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    let realCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    const { total } = await transactionRepository.getBalance();

    if (value > total && type === 'outcome') {
      throw new AppError('Insufficient credits');
    }

    if (!realCategory) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      realCategory = newCategory;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: realCategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
