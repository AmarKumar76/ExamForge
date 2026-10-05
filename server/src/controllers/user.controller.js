const userService = require('../services/user.service');

class UserController {
  async getUsers(req, res, next) {
    try {
      const users = await userService.getUsers(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const user = await userService.updateUserStatus(req.params.id, status, req.user);
      return res.status(200).json({
        success: true,
        message: `User status updated to ${status}.`,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
