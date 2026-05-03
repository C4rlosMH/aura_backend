"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlanRelations = exports.deviceRelations = exports.devices = exports.auraVLANs = exports.operatingSystem = exports.deviceStatus = exports.deviceType = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const organization_model_1 = require("../organization/organization.model");
const staff_model_1 = require("../staff/staff.model");
exports.deviceType = (0, mysql_core_1.mysqlTable)('DeviceType', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    category: (0, mysql_core_1.mysqlEnum)('category', ['COMPUTING', 'NETWORK', 'CCTV', 'PERIPHERAL', 'AUDIOVISUAL', 'POS']).default('COMPUTING').notNull(),
    sub_category: (0, mysql_core_1.varchar)('sub_category', { length: 100 }), // Para mayor granularidad (ej. Impresora -> Térmica)
    icon_id: (0, mysql_core_1.varchar)('icon_id', { length: 100 }), // Lucide/FontAwesome mapping para el Frontend
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.deviceStatus = (0, mysql_core_1.mysqlTable)('DeviceStatus', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    color: (0, mysql_core_1.varchar)('color', { length: 50 }),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.operatingSystem = (0, mysql_core_1.mysqlTable)('OperatingSystem', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.auraVLANs = (0, mysql_core_1.mysqlTable)('Aura_VLANs', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    nombre: (0, mysql_core_1.varchar)('nombre', { length: 255 }).notNull(),
    vlan_number: (0, mysql_core_1.int)('vlan_number').notNull(),
    subnet_cidr: (0, mysql_core_1.varchar)('subnet_cidr', { length: 50 }), // e.g., "192.168.1.0/24"
    siteId: (0, mysql_core_1.int)('siteId').notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.devices = (0, mysql_core_1.mysqlTable)('Device', {
    id: (0, mysql_core_1.int)('id').autoincrement().primaryKey(),
    etiqueta: (0, mysql_core_1.varchar)('etiqueta', { length: 255 }),
    nombre_equipo: (0, mysql_core_1.varchar)('nombre_equipo', { length: 255 }),
    numero_serie: (0, mysql_core_1.varchar)('numero_serie', { length: 255 }),
    marca: (0, mysql_core_1.varchar)('marca', { length: 255 }),
    modelo: (0, mysql_core_1.varchar)('modelo', { length: 255 }),
    ip_equipo: (0, mysql_core_1.varchar)('ip_equipo', { length: 50 }),
    mac_address: (0, mysql_core_1.varchar)('mac_address', { length: 50 }),
    es_panda: (0, mysql_core_1.boolean)('es_panda').default(false).notNull(),
    descripcion: (0, mysql_core_1.text)('descripcion'),
    comentarios: (0, mysql_core_1.text)('comentarios'),
    perfiles_usuario: (0, mysql_core_1.varchar)('perfiles_usuario', { length: 255 }),
    // Software / Licencias
    office_version: (0, mysql_core_1.varchar)('office_version', { length: 255 }),
    office_tipo_licencia: (0, mysql_core_1.varchar)('office_tipo_licencia', { length: 255 }),
    // Garantia
    garantia_numero_producto: (0, mysql_core_1.varchar)('garantia_numero_producto', { length: 255 }),
    garantia_inicio: (0, mysql_core_1.timestamp)('garantia_inicio'),
    garantia_fin: (0, mysql_core_1.timestamp)('garantia_fin'),
    // IA y Metricas Aura
    risk_score: (0, mysql_core_1.decimal)('risk_score', { precision: 5, scale: 2 }),
    last_env_check: (0, mysql_core_1.timestamp)('last_env_check'),
    // Bajas (Disposals)
    fecha_baja: (0, mysql_core_1.timestamp)('fecha_baja'),
    motivo_baja: (0, mysql_core_1.text)('motivo_baja'),
    observaciones_baja: (0, mysql_core_1.text)('observaciones_baja'),
    // Relaciones/Tenants
    usuarioId: (0, mysql_core_1.int)('usuarioId'), // Connects to Staff
    areaId: (0, mysql_core_1.int)('areaId'),
    siteId: (0, mysql_core_1.int)('siteId').notNull(),
    vlanId: (0, mysql_core_1.int)('vlanId'),
    tipoId: (0, mysql_core_1.int)('tipoId').notNull(),
    estadoId: (0, mysql_core_1.int)('estadoId').notNull(),
    sistemaOperativoId: (0, mysql_core_1.int)('sistemaOperativoId'),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)('updatedAt').defaultNow().onUpdateNow().notNull(),
    deletedAt: (0, mysql_core_1.timestamp)('deletedAt')
});
exports.deviceRelations = (0, drizzle_orm_1.relations)(exports.devices, ({ one }) => ({
    staff: one(staff_model_1.staff, { fields: [exports.devices.usuarioId], references: [staff_model_1.staff.id] }),
    area: one(organization_model_1.areas, { fields: [exports.devices.areaId], references: [organization_model_1.areas.id] }),
    site: one(organization_model_1.sites, { fields: [exports.devices.siteId], references: [organization_model_1.sites.id] }),
    vlan: one(exports.auraVLANs, { fields: [exports.devices.vlanId], references: [exports.auraVLANs.id] }),
    type: one(exports.deviceType, { fields: [exports.devices.tipoId], references: [exports.deviceType.id] }),
    status: one(exports.deviceStatus, { fields: [exports.devices.estadoId], references: [exports.deviceStatus.id] }),
    os: one(exports.operatingSystem, { fields: [exports.devices.sistemaOperativoId], references: [exports.operatingSystem.id] })
}));
exports.vlanRelations = (0, drizzle_orm_1.relations)(exports.auraVLANs, ({ one, many }) => ({
    site: one(organization_model_1.sites, { fields: [exports.auraVLANs.siteId], references: [organization_model_1.sites.id] }),
    devices: many(exports.devices)
}));
