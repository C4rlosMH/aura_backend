import fs from 'fs';

const goodTenant = `const getTenantFilter = (user: any) => {
  if (!user) return { hotelId: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER) return null;
  if (user.hotelId && user.allowedHotels && user.allowedHotels.includes(Number(user.hotelId))) return { hotelId: Number(user.hotelId) };
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { hotelId: -1 };
};
`;

const goodHotel = `const getHotelFilter = (user: any) => {
  if (!user) return { id: -1 };
  if (user.rol === ROLES.AURA_ROOT || user.rol === ROLES.CORP_VIEWER) return null;
  if (user.allowedHotels && user.allowedHotels.length > 0) return { in: user.allowedHotels };
  return { id: -1 };
};
`;

[
  'src/modules/staff/staff.service.ts',
  'src/modules/organization/department.service.ts',
  'src/modules/organization/area.service.ts',
  'src/modules/maintenance/maintenance.service.ts',
  'src/modules/inventory/device.service.ts',
  'src/modules/inventory/disposal.service.ts',
].forEach(f => {
   let text = fs.readFileSync(f, 'utf8');
   let start = text.indexOf('const getTenantFilter');
   let end = text.indexOf('export const ', start);
   if (start > -1 && end > -1) {
       text = text.substring(0, start) + goodTenant + '\n' + text.substring(end);
       fs.writeFileSync(f, text);
   }
});

[
  'src/modules/organization/hotel.service.ts'
].forEach(f => {
   let text = fs.readFileSync(f, 'utf8');
   let start = text.indexOf('const getHotelFilter');
   let end = text.indexOf('export const ', start);
   if (start > -1 && end > -1) {
       text = text.substring(0, start) + goodHotel + '\n' + text.substring(end);
       fs.writeFileSync(f, text);
   }
});
