import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser({
      organizationId: req.user!.organizationId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await usersService.findAllByOrganization(req.user!.organizationId);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.findById(req.params.id, req.user!.organizationId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(
      req.params.id,
      req.user!.organizationId,
      req.body,
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.deleteUser(req.params.id, req.user!.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
