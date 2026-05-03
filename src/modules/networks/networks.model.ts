import { mysqlTable, int, varchar, uniqueIndex, mysqlEnum } from "drizzle-orm/mysql-core";
import { sites } from "../organization/organization.model";
import { devices } from "../inventory/inventory.model";

// 1. Tabla de Segmentos de Red (VLANs)
export const auraVlans = mysqlTable('Aura_VLANs', {
    // Cambiamos a int para ser consistentes con tu esquema de organización
    id: int('id').autoincrement().primaryKey(),
    
    vlanNumber: int('vlan_number').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    networkSegment: varchar('network_segment', { length: 18 }).notNull(),
    gateway: varchar('gateway', { length: 15 }),
    
    // siteId DEBE ser int para coincidir con sites.id
    siteId: int('site_id').notNull().references(() => sites.id),
}, (table) => ({
    uniqueVlanPerSite: uniqueIndex('vlan_site_idx').on(table.vlanNumber, table.siteId),
    uniqueSegmentPerSite: uniqueIndex('segment_site_idx').on(table.networkSegment, table.siteId)
}));

// 2. Asignación de IPs (IPAM)
export const ipAssignments = mysqlTable('Aura_IP_Assignments', {
    id: int('id').autoincrement().primaryKey(),
    
    ipAddress: varchar('ip_address', { length: 15 }).notNull(),
    macAddress: varchar('mac_address', { length: 17 }),
    
    deviceId: int('device_id').notNull().references(() => devices.id),
    vlanId: int('vlan_id').notNull().references(() => auraVlans.id),
    
    portNumber: int('port_number'), // Si es Wi-Fi, este campo simplemente queda vacío (null)
    
    // 📡 ¡NUEVO! Para identificar visual y lógicamente el medio de conexión
    connectionType: mysqlEnum('connection_type', ['WIRED', 'WIFI', 'VPN']).default('WIRED'),
    
    // STATIC, DHCP_RESERVED, o DYNAMIC
    type: mysqlEnum('type', ['STATIC', 'DHCP_RESERVED', 'DYNAMIC']).default('STATIC'),
}, (table) => ({
    uniqueIpPerVlan: uniqueIndex('ip_vlan_idx').on(table.ipAddress, table.vlanId)
}));