"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_STATUS = exports.DEFAULTS = exports.ROLES = void 0;
exports.ROLES = {
    AURA_ROOT: "AURA_ROOT", // Dios absoluto
    AURA_SUPPORT: "AURA_SUPPORT", // Soporte Técnico sin datos
    CORP_ADMIN: "CORP_ADMIN", // Admin de Cliente General (Todos los sitios)
    CORP_VIEWER: "CORP_VIEWER", // Corporativo Solo Lectura
    SITE_ADMIN: "SITE_ADMIN", // Admin de propiedad
    SITE_AUX: "SITE_AUX", // Auxiliar de propiedad
    SITE_STAFF: "SITE_STAFF", // Staff Regular
    SITE_GUEST: "SITE_GUEST" // Invitado
};
exports.DEFAULTS = {
    BRAND: 'Genérica',
    MODEL: 'Estándar',
    DEVICE_TYPE: 'Desktops',
    IP: 'DHCP'
};
exports.DEVICE_STATUS = {
    ACTIVE: 'Asignado',
    INVENTORY: 'En Stock',
    DISPOSED: 'Baja'
};
