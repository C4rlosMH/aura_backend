import { mysqlTable, int, varchar, timestamp, boolean, text, mysqlEnum, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { areas, sites } from '../organization/organization.model';
import { staff } from '../staff/staff.model';

export const deviceType = mysqlTable('DeviceType', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['COMPUTING', 'NETWORK', 'CCTV', 'PERIPHERAL', 'AUDIOVISUAL', 'POS']).default('COMPUTING').notNull(),
  sub_category: varchar('sub_category', { length: 100 }), // Para mayor granularidad (ej. Impresora -> Térmica)
  icon_id: varchar('icon_id', { length: 100 }), // Lucide/FontAwesome mapping para el Frontend
  deletedAt: timestamp('deletedAt')
});

export const deviceStatus = mysqlTable('DeviceStatus', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }),
  deletedAt: timestamp('deletedAt')
});

export const operatingSystem = mysqlTable('OperatingSystem', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  deletedAt: timestamp('deletedAt')
});

export const auraVLANs = mysqlTable('Aura_VLANs', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  vlan_number: int('vlan_number').notNull(),
  subnet_cidr: varchar('subnet_cidr', { length: 50 }), // e.g., "192.168.1.0/24"
  siteId: int('siteId').notNull(),
  deletedAt: timestamp('deletedAt')
});

export const devices = mysqlTable('Device', {
  id: int('id').autoincrement().primaryKey(),
  etiqueta: varchar('etiqueta', { length: 255 }),
  nombre_equipo: varchar('nombre_equipo', { length: 255 }),
  numero_serie: varchar('numero_serie', { length: 255 }),
  marca: varchar('marca', { length: 255 }),
  modelo: varchar('modelo', { length: 255 }),
  ip_equipo: varchar('ip_equipo', { length: 50 }),
  mac_address: varchar('mac_address', { length: 50 }),
  es_panda: boolean('es_panda').default(false).notNull(),
  descripcion: text('descripcion'),
  comentarios: text('comentarios'),
  perfiles_usuario: varchar('perfiles_usuario', { length: 255 }),
  
  // Software / Licencias
  office_version: varchar('office_version', { length: 255 }),
  office_tipo_licencia: varchar('office_tipo_licencia', { length: 255 }),
  
  // Garantia
  garantia_numero_producto: varchar('garantia_numero_producto', { length: 255 }),
  garantia_inicio: timestamp('garantia_inicio'),
  garantia_fin: timestamp('garantia_fin'),

  // IA y Metricas Aura
  risk_score: decimal('risk_score', { precision: 5, scale: 2 }),
  last_env_check: timestamp('last_env_check'),

  // Bajas (Disposals)
  fecha_baja: timestamp('fecha_baja'),
  motivo_baja: text('motivo_baja'),
  observaciones_baja: text('observaciones_baja'),

  // Relaciones/Tenants
  usuarioId: int('usuarioId'), // Connects to Staff
  areaId: int('areaId'), 
  siteId: int('siteId').notNull(),
  vlanId: int('vlanId'),
  tipoId: int('tipoId').notNull(),
  estadoId: int('estadoId').notNull(),
  sistemaOperativoId: int('sistemaOperativoId'),

  created_at: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deletedAt')
});

export const deviceRelations = relations(devices, ({ one }) => ({
   staff: one(staff, { fields: [devices.usuarioId], references: [staff.id] }),
   area: one(areas, { fields: [devices.areaId], references: [areas.id] }),
   site: one(sites, { fields: [devices.siteId], references: [sites.id] }),
   vlan: one(auraVLANs, { fields: [devices.vlanId], references: [auraVLANs.id] }),
   type: one(deviceType, { fields: [devices.tipoId], references: [deviceType.id] }),
   status: one(deviceStatus, { fields: [devices.estadoId], references: [deviceStatus.id] }),
   os: one(operatingSystem, { fields: [devices.sistemaOperativoId], references: [operatingSystem.id] })
}));

export const vlanRelations = relations(auraVLANs, ({ one, many }) => ({
   site: one(sites, { fields: [auraVLANs.siteId], references: [sites.id] }),
   devices: many(devices)
}));
