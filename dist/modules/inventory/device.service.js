"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceById = exports.deleteDevice = exports.updateDevice = exports.createDevice = exports.getActiveDevices = void 0;
const database_1 = require("../../core/database");
const inventory_model_1 = require("./inventory.model");
const drizzle_orm_1 = require("drizzle-orm");
const auditService = __importStar(require("../audit/audit.service"));
const constants_js_1 = require("../../config/constants.js");
const getTenantFilter = (user) => {
    if (!user)
        return { siteId: -1 };
    if (user.rol === constants_js_1.ROLES.AURA_ROOT || user.rol === constants_js_1.ROLES.CORP_VIEWER || user.rol === constants_js_1.ROLES.CORP_ADMIN)
        return null;
    if (user.siteId && user.allowedSites && user.allowedSites.includes(Number(user.siteId)))
        return { siteId: Number(user.siteId) };
    if (user.allowedSites && user.allowedSites.length > 0)
        return { in: user.allowedSites };
    return { siteId: -1 };
};
const isIpInCidr = (ip, cidr) => {
    try {
        const [subnet, bits] = cidr.split('/');
        const mask = parseInt(bits, 10);
        const ipToLong = (addr) => addr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
        const cidrToMask = (m) => -1 << (32 - m) >>> 0;
        return (ipToLong(ip) & cidrToMask(mask)) === (ipToLong(subnet) & cidrToMask(mask));
    }
    catch {
        return false;
    }
};
const getActiveDevices = async ({ skip, take, search, filter, sortBy, order, typeIds }, user) => {
    const tenantFilter = getTenantFilter(user);
    const conditions = [(0, drizzle_orm_1.isNull)(inventory_model_1.devices.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conditions.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, -1));
        else if (tenantFilter.in)
            conditions.push((0, drizzle_orm_1.inArray)(inventory_model_1.devices.siteId, tenantFilter.in));
        else if (tenantFilter.siteId)
            conditions.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, tenantFilter.siteId));
    }
    const disposedStatusIdRes = await database_1.db.query.deviceStatus.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.deviceStatus.nombre, constants_js_1.DEVICE_STATUS.DISPOSED) });
    if (disposedStatusIdRes)
        conditions.push((0, drizzle_orm_1.ne)(inventory_model_1.devices.estadoId, disposedStatusIdRes.id));
    if (typeIds && typeIds.length > 0) {
        conditions.push((0, drizzle_orm_1.inArray)(inventory_model_1.devices.tipoId, typeIds));
    }
    if (search) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(inventory_model_1.devices.etiqueta, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.nombre_equipo, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.numero_serie, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.mac_address, `%${search}%`), (0, drizzle_orm_1.ilike)(inventory_model_1.devices.ip_equipo, `%${search}%`)));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDays = new Date(today);
    ninetyDays.setDate(today.getDate() + 90);
    if (filter === 'no-panda')
        conditions.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.es_panda, false));
    else if (filter === 'expired-warranty')
        conditions.push((0, drizzle_orm_1.lt)(inventory_model_1.devices.garantia_fin, today));
    else if (filter === 'warranty-risk')
        conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(inventory_model_1.devices.garantia_fin, today), (0, drizzle_orm_1.lte)(inventory_model_1.devices.garantia_fin, ninetyDays)));
    const list = await database_1.db.query.devices.findMany({
        where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
        offset: skip,
        ...(take && { limit: take }),
        with: {
            staff: true,
            type: true,
            status: true,
            os: true,
            area: { with: { departamento: true } },
            vlan: true
        },
        orderBy: (devices, { asc, desc }) => [order === 'desc' ? desc(devices[sortBy || 'id']) : asc(devices[sortBy || 'id'])]
    });
    const total = await database_1.db.query.devices.findMany({ where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined, columns: { id: true } });
    return { devices: list, totalCount: total.length };
};
exports.getActiveDevices = getActiveDevices;
const createDevice = async (data, user) => {
    let siteIdToAssign = user.siteId;
    if (!siteIdToAssign && data.siteId)
        siteIdToAssign = Number(data.siteId);
    if (!siteIdToAssign)
        throw new Error("Aura Core: Se requiere asignar el Tenant (Site) para catalogar este dispositivo.");
    // Validación de VLAN Inteligente
    if (data.ip_equipo && data.vlanId) {
        const vlanInfo = await database_1.db.query.auraVLANs.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.auraVLANs.id, data.vlanId) });
        if (vlanInfo && vlanInfo.subnet_cidr && !isIpInCidr(data.ip_equipo, vlanInfo.subnet_cidr)) {
            throw new Error(`Aura Security Protocol: La IP provista no calza con el segmento CIDR (${vlanInfo.subnet_cidr}) de su VLAN asociada.`);
        }
    }
    // Set IA dummy metrics
    const risk_score = (Math.random() * (15 - 0.1) + 0.1).toFixed(2);
    const [result] = await database_1.db.insert(inventory_model_1.devices).values({
        ...data,
        es_panda: !!data.es_panda,
        siteId: siteIdToAssign,
        risk_score: data.risk_score || risk_score,
        last_env_check: new Date()
    });
    const newId = result.insertId;
    const newDevice = await (0, exports.getDeviceById)(newId, user);
    await auditService.logActivity({
        action: 'CREATE', entity: 'Device', entityId: newId, newData: newDevice, user, details: `Dispositivo indexado: ${newDevice?.nombre_equipo}`
    });
    return newDevice;
};
exports.createDevice = createDevice;
const updateDevice = async (id, data, user) => {
    const deviceId = Number(id);
    const oldDevice = await (0, exports.getDeviceById)(deviceId, user);
    if (!oldDevice)
        throw new Error("Dispositivo fantasma o denegado por políticas de Tenant.");
    if (data.ip_equipo || data.vlanId) {
        const IP = data.ip_equipo || oldDevice.ip_equipo;
        const vId = data.vlanId || oldDevice.vlanId;
        if (IP && vId) {
            const vlanInfo = await database_1.db.query.auraVLANs.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.auraVLANs.id, vId) });
            if (vlanInfo && vlanInfo.subnet_cidr && !isIpInCidr(IP, vlanInfo.subnet_cidr)) {
                throw new Error(`Aura Security Protocol: La IP registrada no encaja con el entorno CIDR (${vlanInfo.subnet_cidr}) de su VLAN.`);
            }
        }
    }
    const disposedStatus = await database_1.db.query.deviceStatus.findFirst({ where: (0, drizzle_orm_1.eq)(inventory_model_1.deviceStatus.nombre, constants_js_1.DEVICE_STATUS.DISPOSED) });
    const disposedId = disposedStatus?.id;
    if (disposedId) {
        if (oldDevice.estadoId === disposedId && data.estadoId && data.estadoId !== disposedId) {
            data.fecha_baja = null;
            data.motivo_baja = null;
            data.observaciones_baja = null;
        }
        else if (data.estadoId === disposedId && oldDevice.estadoId !== disposedId && !data.fecha_baja) {
            data.fecha_baja = new Date();
        }
    }
    await database_1.db.update(inventory_model_1.devices).set({ ...data, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(inventory_model_1.devices.id, deviceId));
    const updatedDevice = await (0, exports.getDeviceById)(deviceId, user);
    await auditService.logActivity({
        action: 'UPDATE', entity: 'Device', entityId: deviceId, oldData: oldDevice, newData: updatedDevice, user, details: `Device metadata actualizada: ${updatedDevice?.nombre_equipo}`
    });
    return updatedDevice;
};
exports.updateDevice = updateDevice;
const deleteDevice = async (id, user) => {
    const deviceId = Number(id);
    const old = await (0, exports.getDeviceById)(deviceId, user);
    if (!old)
        throw new Error("No localizado");
    await database_1.db.update(inventory_model_1.devices).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(inventory_model_1.devices.id, deviceId));
    await auditService.logActivity({
        action: 'DELETE', entity: 'Device', entityId: deviceId, oldData: old, user, details: 'Dispositivo enviado al archivo muerto (Soft Delete)'
    });
    return { message: "Eliminado de Aura Network" };
};
exports.deleteDevice = deleteDevice;
const getDeviceById = async (id, user) => {
    const tenantFilter = getTenantFilter(user);
    const conds = [(0, drizzle_orm_1.eq)(inventory_model_1.devices.id, Number(id)), (0, drizzle_orm_1.isNull)(inventory_model_1.devices.deletedAt)];
    if (tenantFilter) {
        if (tenantFilter.siteId === -1)
            conds.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, -1));
        else if (tenantFilter.siteId)
            conds.push((0, drizzle_orm_1.eq)(inventory_model_1.devices.siteId, tenantFilter.siteId));
        else if (tenantFilter.in)
            conds.push((0, drizzle_orm_1.inArray)(inventory_model_1.devices.siteId, tenantFilter.in));
    }
    return await database_1.db.query.devices.findFirst({
        where: (0, drizzle_orm_1.and)(...conds),
        with: { staff: true, type: true, status: true, os: true, area: { with: { departamento: true } }, site: true, vlan: true }
    });
};
exports.getDeviceById = getDeviceById;
