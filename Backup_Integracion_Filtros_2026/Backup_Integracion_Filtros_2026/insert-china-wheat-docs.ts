import Database from 'better-sqlite3';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const db = new Database('comexia_v2.db');

console.log('📝 Insertando documentos regulatorios para China - Trigo...');

// Documentos reales requeridos por China para importación de trigo desde Argentina
const docs = [
  {
    name: "Certificado Fitosanitario",
    issuer: "SENASA Argentina",
    description: "Certificado que garantiza que el trigo está libre de plagas y enfermedades cuarentenarias",
    priority: 1
  },
  {
    name: "Certificado de Calidad",
    issuer: "Laboratorio Oficial",
    description: "Análisis de calidad del trigo: proteína, humedad, peso hectolítrico, impurezas",
    priority: 1
  },
  {
    name: "Certificado de Origen",
    issuer: "Cámara de Comercio Argentina",
    description: "Documento que certifica el origen argentino del trigo",
    priority: 1
  },
  {
    name: "Permiso de Importación (AQSIQ)",
    issuer: "Administración General de Aduanas de China (GACC)",
    description: "Registro previo del exportador en el sistema AQSIQ de China",
    priority: 1
  },
  {
    name: "Certificado de No-GMO",
    issuer: "Laboratorio Certificado",
    description: "Certificado que garantiza que el trigo no es genéticamente modificado",
    priority: 2
  },
  {
    name: "Factura Comercial",
    issuer: "Exportador",
    description: "Factura detallando cantidad, precio, términos de venta (FOB/CIF)",
    priority: 1
  },
  {
    name: "Packing List",
    issuer: "Exportador",
    description: "Lista de empaque detallando contenedores, peso neto/bruto, marcas",
    priority: 1
  },
  {
    name: "Bill of Lading (B/L)",
    issuer: "Naviera",
    description: "Conocimiento de embarque marítimo",
    priority: 1
  },
  {
    name: "Certificado de Fumigación",
    issuer: "Empresa Fumigadora Certificada",
    description: "Certificado de fumigación con bromuro de metilo o fosfina según requerimientos chinos",
    priority: 2
  },
  {
    name: "Análisis de Micotoxinas",
    issuer: "Laboratorio Oficial",
    description: "Certificado de análisis de aflatoxinas, DON (deoxinivalenol) y otras micotoxinas",
    priority: 1
  }
];

const insert = db.prepare(`
  INSERT INTO regulatory_rules (
    id, country_code, hs_chapter, document_name, issuer, description, requirements, priority, created_at
  ) VALUES (
    @id, @countryCode, @hsChapter, @documentName, @issuer, @description, @requirements, @priority, @createdAt
  )
`);

let count = 0;
for (const doc of docs) {
  try {
    insert.run({
      id: uuid(),
      countryCode: 'CN',
      hsChapter: '10', // Trigo
      documentName: doc.name,
      issuer: doc.issuer,
      description: doc.description,
      requirements: doc.description,
      priority: doc.priority,
      createdAt: Date.now()
    });
    count++;
  } catch (e: any) {
    console.log('Error insertando:', doc.name, e.message);
  }
}

console.log(`✅ Insertados ${count} documentos para China/Trigo`);

// Verificar
const verify = db.prepare('SELECT * FROM regulatory_rules WHERE country_code = ? AND hs_chapter = ?').all('CN', '10');
console.log(`📊 Total documentos en BD para China/Trigo: ${verify.length}`);

db.close();
