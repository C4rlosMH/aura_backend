import { getMachineFingerprint } from "../security/hardware.service"; 

console.log("\n=======================================================");
console.log("🛡️ GENERADOR DE HUELLA DIGITAL AURA (MACHINE ID)");
console.log("=======================================================");
try {
    const fingerprint = getMachineFingerprint();
    console.log(`\nLlave del Servidor Actual:\n${fingerprint}\n`);
    console.log("Guarda este código. Será la licencia autorizada para este servidor.");
} catch (e) {
    console.log("Error leyendo hardware. Ejecuta la terminal como Administrador.");
}
console.log("=======================================================\n");