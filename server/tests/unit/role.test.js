const { requireRole } = require('../../src/middleware/role.middleware');

describe('Unit Test: Role Middleware (RBAC)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should deny access if user is not attached to request', () => {
    const middleware = requireRole('STUDENT');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if user role is permitted', () => {
    req.user = { role: 'INSTRUCTOR' };
    const middleware = requireRole('INSTRUCTOR', 'SUPER_ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should deny access if user role is not permitted', () => {
    req.user = { role: 'STUDENT' };
    const middleware = requireRole('INSTRUCTOR', 'SUPER_ADMIN');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
