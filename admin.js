import AdminHandlers from './src/handlers/admin.js';
import { bot } from './src/index.js';

let adminInstance = null;

function getAdminInstance() {
  if (!adminInstance) {
    adminInstance = new AdminHandlers(bot);
  }
  return adminInstance;
}

export const isAdmin = async (ctx) => {
  const admin = getAdminInstance();
  return admin.isAdmin(ctx);
};

export const showAdminPanel = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showAdminPanel(ctx);
};

export const showPendingOrders = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showPendingOrders(ctx);
};

export const confirmOrder = async (ctx, orderId) => {
  const admin = getAdminInstance();
  return admin.confirmOrder(ctx, orderId);
};

export const rejectOrder = async (ctx, orderId) => {
  const admin = getAdminInstance();
  return admin.rejectOrder(ctx, orderId);
};

export const showMenuManagement = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showMenuManagement(ctx);
};

export const showPartnersManagement = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showPartnersManagement(ctx);
};

export const showStats = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showStats(ctx);
};

export const showUsers = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showUsers(ctx);
};

export const showManageAdmins = async (ctx) => {
  const admin = getAdminInstance();
  return admin.showManageAdmins(ctx);
};

export const addAdminByUsername = async (username) => {
  const admin = getAdminInstance();
  return admin.addAdminByUsername(username);
};

export const removeAdminByUsername = async (username) => {
  const admin = getAdminInstance();
  return admin.removeAdminByUsername(username);
};

export const addPartner = async (ctx, name, category, commission) => {
  const admin = getAdminInstance();
  return admin.addPartner(ctx, name, category, commission);
};

export const editPartner = async (partnerId, updates) => {
  const admin = getAdminInstance();
  return admin.editPartner(partnerId, updates);
};

export const deletePartner = async (partnerId) => {
  const admin = getAdminInstance();
  return admin.deletePartner(partnerId);
};

export const getAdminKeyboard = async () => {
  const admin = getAdminInstance();
  return admin.getAdminKeyboard();
};

export const getAdminList = async () => {
  const admin = getAdminInstance();
  return admin.getAdminList();
};

export default {
  isAdmin,
  showAdminPanel,
  showPendingOrders,
  confirmOrder,
  rejectOrder,
  showMenuManagement,
  showPartnersManagement,
  showStats,
  showUsers,
  showManageAdmins,
  addAdminByUsername,
  removeAdminByUsername,
  addPartner,
  editPartner,
  deletePartner,
  getAdminKeyboard,
  getAdminList
};
