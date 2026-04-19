import { Request, Response, NextFunction } from "express";
import * as departmentService from "./department.service";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getDepartments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "nombre";
    const order = (req.query.order as "asc"|"desc") || "asc";
    const skip = (page - 1) * limit;

    if (isNaN(limit) || limit === 0 || req.query.limit === undefined || req.query.limit === '0') {
        const departments = await departmentService.getAllDepartments(req.user);
        return res.json(departments);
    }
    
    const { departments, totalCount } = await departmentService.getDepartments({ skip, take: limit, sortBy, order }, req.user);

    res.json({ data: departments, totalCount: totalCount, currentPage: page, totalPages: Math.ceil(totalCount / limit) });
  } catch (error) { 
    next(error); 
  }
};

export const getDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const department = await departmentService.getDepartmentById(String(req.params.id), req.user);
    if (!department) return res.status(404).json({ message: "Department not found" });
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const department = await departmentService.createDepartment(req.body, req.user);
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const department = await departmentService.updateDepartment(String(req.params.id), req.body, req.user);
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await departmentService.deleteDepartment(String(req.params.id), req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
