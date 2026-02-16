/**
 * Required Documents Database - Phase 22 Enhanced
 * 100% Informative and Safe - Links to Official Sources Only
 * No template generation or downloads
 */

export interface RequiredDocument {
  id: string;
  name: string;
  nameEs: string;
  category: 'commercial' | 'transport' | 'customs' | 'product' | 'financial';
  description: string;
  descriptionEs: string;
  requiredFor: {
    countries?: string[]; // If empty, required for all
    hsCodes?: string[]; // If empty, required for all products
    incoterms?: string[]; // If empty, required for all incoterms
    direction?: 'import' | 'export' | 'both';
  };
  // Official management links by country
  managementLinks: {
    [countryCode: string]: {
      url: string;
      authority: string;
      authorityEs: string;
    };
  };
  processingDays?: number;
  mandatory: boolean;
  status: 'mandatory' | 'optional' | 'conditional';
}

export const documentsDatabase: RequiredDocument[] = [
  // Commercial Documents
  {
    id: 'commercial-invoice',
    name: 'Commercial Invoice',
    nameEs: 'Factura Comercial',
    category: 'commercial',
    description: 'Official document detailing the sale transaction between exporter and importer, including product description, quantity, unit price, and total value. Required for customs clearance.',
    descriptionEs: 'Documento oficial que detalla la transacción de venta entre exportador e importador, incluyendo descripción del producto, cantidad, precio unitario y valor total. Requerido para despacho aduanero.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.afip.gob.ar/exportacion/',
        authority: 'AFIP - Argentine Tax Authority',
        authorityEs: 'AFIP - Administración Federal de Ingresos Públicos'
      },
      'BR': {
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior',
        authority: 'Receita Federal do Brasil',
        authorityEs: 'Receita Federal de Brasil'
      },
      'UY': {
        url: 'https://www.aduanas.gub.uy/',
        authority: 'Dirección Nacional de Aduanas Uruguay',
        authorityEs: 'Dirección Nacional de Aduanas Uruguay'
      },
      'PY': {
        url: 'https://www.aduana.gov.py/',
        authority: 'Dirección Nacional de Aduanas Paraguay',
        authorityEs: 'Dirección Nacional de Aduanas Paraguay'
      },
      'CL': {
        url: 'https://www.aduana.cl/',
        authority: 'Servicio Nacional de Aduanas Chile',
        authorityEs: 'Servicio Nacional de Aduanas Chile'
      },
      'PE': {
        url: 'https://www.sunat.gob.pe/orientacionaduanera/',
        authority: 'SUNAT - Peru Customs',
        authorityEs: 'SUNAT - Superintendencia Nacional de Aduanas'
      },
      'US': {
        url: 'https://www.cbp.gov/trade',
        authority: 'U.S. Customs and Border Protection',
        authorityEs: 'Aduana y Protección Fronteriza de EE.UU.'
      },
      'DEFAULT': {
        url: 'https://www.wto.org/english/tratop_e/tradfa_e/tradfa_e.htm',
        authority: 'WTO Trade Facilitation',
        authorityEs: 'OMC Facilitación del Comercio'
      }
    },
    processingDays: 1,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'packing-list',
    name: 'Packing List',
    nameEs: 'Lista de Empaque',
    category: 'commercial',
    description: 'Detailed inventory of shipment contents including number of packages, weight, dimensions, and description of goods. Essential for customs inspection and logistics.',
    descriptionEs: 'Inventario detallado del contenido del envío incluyendo número de bultos, peso, dimensiones y descripción de mercancías. Esencial para inspección aduanera y logística.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'DEFAULT': {
        url: 'https://iccwbo.org/resources-for-business/incoterms-rules/',
        authority: 'ICC - International Chamber of Commerce',
        authorityEs: 'CCI - Cámara de Comercio Internacional'
      }
    },
    processingDays: 1,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'proforma-invoice',
    name: 'Proforma Invoice',
    nameEs: 'Factura Proforma',
    category: 'commercial',
    description: 'Preliminary invoice sent before shipment to provide buyer with estimated costs. Used for customs valuation and import permits.',
    descriptionEs: 'Factura preliminar enviada antes del envío para proporcionar al comprador costos estimados. Utilizada para valoración aduanera y permisos de importación.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'DEFAULT': {
        url: 'https://iccwbo.org/',
        authority: 'International Chamber of Commerce',
        authorityEs: 'Cámara de Comercio Internacional'
      }
    },
    processingDays: 1,
    mandatory: false,
    status: 'optional'
  },

  // Transport Documents
  {
    id: 'bill-of-lading',
    name: 'Bill of Lading (B/L)',
    nameEs: 'Conocimiento de Embarque',
    category: 'transport',
    description: 'Legal document issued by carrier acknowledging receipt of cargo for shipment. Serves as receipt, contract of carriage, and document of title.',
    descriptionEs: 'Documento legal emitido por el transportista que confirma la recepción de la carga. Sirve como recibo, contrato de transporte y título de propiedad.',
    requiredFor: { incoterms: ['FOB', 'CIF', 'CFR'], direction: 'both' },
    managementLinks: {
      'DEFAULT': {
        url: 'https://www.imo.org/',
        authority: 'International Maritime Organization',
        authorityEs: 'Organización Marítima Internacional'
      }
    },
    processingDays: 2,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'airway-bill',
    name: 'Air Waybill (AWB)',
    nameEs: 'Guía Aérea',
    category: 'transport',
    description: 'Document for air cargo shipment issued by airline or freight forwarder. Non-negotiable transport document.',
    descriptionEs: 'Documento para envío de carga aérea emitido por aerolínea o agente de carga. Documento de transporte no negociable.',
    requiredFor: { incoterms: ['FCA', 'CPT', 'CIP'], direction: 'both' },
    managementLinks: {
      'DEFAULT': {
        url: 'https://www.iata.org/en/programs/cargo/',
        authority: 'IATA - International Air Transport Association',
        authorityEs: 'IATA - Asociación Internacional de Transporte Aéreo'
      }
    },
    processingDays: 1,
    mandatory: true,
    status: 'mandatory'
  },

  // Customs Documents
  {
    id: 'certificate-of-origin',
    name: 'Certificate of Origin',
    nameEs: 'Certificado de Origen',
    category: 'customs',
    description: 'Official document certifying the country where goods were manufactured or produced. Required for preferential tariff treatment under trade agreements.',
    descriptionEs: 'Documento oficial que certifica el país donde se fabricaron o produjeron los bienes. Requerido para tratamiento arancelario preferencial bajo acuerdos comerciales.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.afip.gob.ar/exportacion/certificados-origen/',
        authority: 'AFIP - Certificate of Origin',
        authorityEs: 'AFIP - Certificados de Origen'
      },
      'BR': {
        url: 'https://www.gov.br/mdic/pt-br',
        authority: 'Ministry of Economy - Brazil',
        authorityEs: 'Ministerio de Economía - Brasil'
      },
      'UY': {
        url: 'https://www.uruguayxxi.gub.uy/',
        authority: 'Uruguay XXI - Export Promotion',
        authorityEs: 'Uruguay XXI - Promoción de Exportaciones'
      },
      'CL': {
        url: 'https://www.prochile.gob.cl/',
        authority: 'ProChile - Export Promotion',
        authorityEs: 'ProChile - Promoción de Exportaciones'
      },
      'PE': {
        url: 'https://www.sunat.gob.pe/orientacionaduanera/certificadoorigen/',
        authority: 'SUNAT - Certificate of Origin',
        authorityEs: 'SUNAT - Certificado de Origen'
      },
      'DEFAULT': {
        url: 'https://www.wto.org/english/tratop_e/roi_e/roi_e.htm',
        authority: 'WTO - Rules of Origin',
        authorityEs: 'OMC - Reglas de Origen'
      }
    },
    processingDays: 3,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'import-license',
    name: 'Import License',
    nameEs: 'Licencia de Importación',
    category: 'customs',
    description: 'Government authorization required to import restricted or controlled goods such as pharmaceuticals, chemicals, or agricultural products.',
    descriptionEs: 'Autorización gubernamental requerida para importar bienes restringidos o controlados como productos farmacéuticos, químicos o agrícolas.',
    requiredFor: { 
      direction: 'import',
      hsCodes: ['17', '24', '87', '93', '30'] // Sugar, Tobacco, Vehicles, Arms, Pharmaceuticals
    },
    managementLinks: {
      'AR': {
        url: 'https://www.argentina.gob.ar/produccion/comercio-exterior',
        authority: 'Ministry of Production - Import Licenses',
        authorityEs: 'Ministerio de Producción - Licencias de Importación'
      },
      'BR': {
        url: 'https://www.gov.br/siscomex/pt-br',
        authority: 'SISCOMEX - Foreign Trade System',
        authorityEs: 'SISCOMEX - Sistema de Comercio Exterior'
      },
      'US': {
        url: 'https://www.trade.gov/import-licensing',
        authority: 'U.S. Department of Commerce',
        authorityEs: 'Departamento de Comercio de EE.UU.'
      },
      'DEFAULT': {
        url: 'https://www.wto.org/english/tratop_e/implic_e/implic_e.htm',
        authority: 'WTO - Import Licensing',
        authorityEs: 'OMC - Licencias de Importación'
      }
    },
    processingDays: 15,
    mandatory: true,
    status: 'conditional'
  },
  {
    id: 'export-license',
    name: 'Export License',
    nameEs: 'Licencia de Exportación',
    category: 'customs',
    description: 'Government authorization required to export controlled goods including arms, dual-use items, or strategic materials.',
    descriptionEs: 'Autorización gubernamental requerida para exportar bienes controlados incluyendo armas, artículos de doble uso o materiales estratégicos.',
    requiredFor: { 
      direction: 'export',
      hsCodes: ['93', '28', '29', '84', '85'] // Arms, Chemicals, Machinery
    },
    managementLinks: {
      'AR': {
        url: 'https://www.argentina.gob.ar/anmac',
        authority: 'ANMaC - National Arms Registry',
        authorityEs: 'ANMaC - Registro Nacional de Armas'
      },
      'US': {
        url: 'https://www.bis.doc.gov/index.php/licensing',
        authority: 'BIS - Bureau of Industry and Security',
        authorityEs: 'BIS - Oficina de Industria y Seguridad'
      },
      'DEFAULT': {
        url: 'https://www.wassenaar.org/',
        authority: 'Wassenaar Arrangement',
        authorityEs: 'Arreglo de Wassenaar'
      }
    },
    processingDays: 15,
    mandatory: true,
    status: 'conditional'
  },
  {
    id: 'customs-declaration',
    name: 'Customs Declaration',
    nameEs: 'Declaración Aduanera',
    category: 'customs',
    description: 'Official declaration of goods submitted to customs authorities for import or export clearance. Includes tariff classification, value, and origin.',
    descriptionEs: 'Declaración oficial de mercancías presentada a autoridades aduaneras para despacho de importación o exportación. Incluye clasificación arancelaria, valor y origen.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.afip.gob.ar/sitio/externos/default.asp',
        authority: 'AFIP - Customs System',
        authorityEs: 'AFIP - Sistema Aduanero'
      },
      'BR': {
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao',
        authority: 'Receita Federal - Import Clearance',
        authorityEs: 'Receita Federal - Despacho de Importación'
      },
      'US': {
        url: 'https://www.cbp.gov/trade/ace',
        authority: 'ACE - Automated Commercial Environment',
        authorityEs: 'ACE - Entorno Comercial Automatizado'
      },
      'DEFAULT': {
        url: 'https://www.wcoomd.org/',
        authority: 'World Customs Organization',
        authorityEs: 'Organización Mundial de Aduanas'
      }
    },
    processingDays: 1,
    mandatory: true,
    status: 'mandatory'
  },

  // Product-Specific Documents
  {
    id: 'phytosanitary-certificate',
    name: 'Phytosanitary Certificate',
    nameEs: 'Certificado Fitosanitario',
    category: 'product',
    description: 'Official certificate issued by plant protection authority confirming that plants and plant products are free from quarantine pests and comply with phytosanitary regulations.',
    descriptionEs: 'Certificado oficial emitido por autoridad de protección vegetal confirmando que plantas y productos vegetales están libres de plagas cuarentenarias y cumplen con regulaciones fitosanitarias.',
    requiredFor: { 
      hsCodes: ['06', '07', '08', '09', '10', '11', '12'], // Plants, vegetables, fruits, cereals
      direction: 'both'
    },
    managementLinks: {
      'AR': {
        url: 'https://www.senasa.gob.ar/tramites/certificado-fitosanitario-de-exportacion',
        authority: 'SENASA - Phytosanitary Certificate',
        authorityEs: 'SENASA - Certificado Fitosanitario'
      },
      'BR': {
        url: 'https://www.gov.br/agricultura/pt-br/assuntos/sanidade-animal-e-vegetal',
        authority: 'MAPA - Ministry of Agriculture Brazil',
        authorityEs: 'MAPA - Ministerio de Agricultura Brasil'
      },
      'CL': {
        url: 'https://www.sag.gob.cl/',
        authority: 'SAG - Agricultural and Livestock Service',
        authorityEs: 'SAG - Servicio Agrícola y Ganadero'
      },
      'PE': {
        url: 'https://www.senasa.gob.pe/senasa/certificado-fitosanitario/',
        authority: 'SENASA Peru - Phytosanitary',
        authorityEs: 'SENASA Perú - Fitosanitario'
      },
      'US': {
        url: 'https://www.aphis.usda.gov/aphis/ourfocus/planthealth',
        authority: 'USDA APHIS - Plant Health',
        authorityEs: 'USDA APHIS - Sanidad Vegetal'
      },
      'DEFAULT': {
        url: 'https://www.ippc.int/',
        authority: 'IPPC - International Plant Protection Convention',
        authorityEs: 'CIPF - Convención Internacional de Protección Fitosanitaria'
      }
    },
    processingDays: 5,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'sanitary-certificate',
    name: 'Sanitary Certificate',
    nameEs: 'Certificado Sanitario',
    category: 'product',
    description: 'Official certificate for animal products, meat, dairy, and fish confirming compliance with health and safety standards. Issued by veterinary authority.',
    descriptionEs: 'Certificado oficial para productos animales, carne, lácteos y pescado confirmando cumplimiento con estándares de salud y seguridad. Emitido por autoridad veterinaria.',
    requiredFor: { 
      hsCodes: ['01', '02', '03', '04', '05', '15', '16'], // Live animals, meat, fish, dairy
      direction: 'both'
    },
    managementLinks: {
      'AR': {
        url: 'https://www.senasa.gob.ar/cadena-animal/productos-de-origen-animal',
        authority: 'SENASA - Animal Products',
        authorityEs: 'SENASA - Productos de Origen Animal'
      },
      'BR': {
        url: 'https://www.gov.br/agricultura/pt-br/assuntos/inspecao/produtos-animal',
        authority: 'MAPA - Animal Product Inspection',
        authorityEs: 'MAPA - Inspección de Productos Animales'
      },
      'UY': {
        url: 'https://www.gub.uy/ministerio-ganaderia-agricultura-pesca/',
        authority: 'MGAP - Ministry of Livestock Uruguay',
        authorityEs: 'MGAP - Ministerio de Ganadería Uruguay'
      },
      'US': {
        url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/export-import-food-products',
        authority: 'USDA FSIS - Food Safety',
        authorityEs: 'USDA FSIS - Seguridad Alimentaria'
      },
      'DEFAULT': {
        url: 'https://www.woah.org/',
        authority: 'WOAH - World Organisation for Animal Health',
        authorityEs: 'OMSA - Organización Mundial de Sanidad Animal'
      }
    },
    processingDays: 5,
    mandatory: true,
    status: 'mandatory'
  },
  {
    id: 'quality-certificate',
    name: 'Quality Certificate / Certificate of Analysis',
    nameEs: 'Certificado de Calidad / Certificado de Análisis',
    category: 'product',
    description: 'Certificate issued by accredited laboratory or inspection agency confirming product meets specified quality standards and technical specifications.',
    descriptionEs: 'Certificado emitido por laboratorio acreditado o agencia de inspección confirmando que el producto cumple con estándares de calidad y especificaciones técnicas.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.inti.gob.ar/',
        authority: 'INTI - National Institute of Industrial Technology',
        authorityEs: 'INTI - Instituto Nacional de Tecnología Industrial'
      },
      'DEFAULT': {
        url: 'https://www.iso.org/',
        authority: 'ISO - International Organization for Standardization',
        authorityEs: 'ISO - Organización Internacional de Normalización'
      }
    },
    processingDays: 7,
    mandatory: false,
    status: 'optional'
  },
  {
    id: 'fumigation-certificate',
    name: 'Fumigation Certificate (ISPM 15)',
    nameEs: 'Certificado de Fumigación (NIMF 15)',
    category: 'product',
    description: 'Certificate for wooden packaging materials (pallets, crates) confirming treatment to prevent pest transmission. Required by ISPM 15 international standard.',
    descriptionEs: 'Certificado para materiales de embalaje de madera (paletas, cajas) confirmando tratamiento para prevenir transmisión de plagas. Requerido por norma internacional NIMF 15.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.senasa.gob.ar/cadena-vegetal/forestales/embalajes-de-madera',
        authority: 'SENASA - Wood Packaging',
        authorityEs: 'SENASA - Embalajes de Madera'
      },
      'DEFAULT': {
        url: 'https://www.ippc.int/en/core-activities/standards-setting/ispms/',
        authority: 'IPPC - ISPM 15 Standard',
        authorityEs: 'CIPF - Norma NIMF 15'
      }
    },
    processingDays: 3,
    mandatory: false,
    status: 'conditional'
  },

  // Financial Documents
  {
    id: 'letter-of-credit',
    name: 'Letter of Credit (L/C)',
    nameEs: 'Carta de Crédito',
    category: 'financial',
    description: 'Bank guarantee of payment issued by buyer\'s bank ensuring seller receives payment upon presenting compliant documents. Common payment method in international trade.',
    descriptionEs: 'Garantía bancaria de pago emitida por banco del comprador asegurando que el vendedor reciba el pago al presentar documentos conformes. Método de pago común en comercio internacional.',
    requiredFor: { direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.bcra.gob.ar/',
        authority: 'BCRA - Central Bank of Argentina',
        authorityEs: 'BCRA - Banco Central de la República Argentina'
      },
      'DEFAULT': {
        url: 'https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/',
        authority: 'ICC - International Chamber of Commerce',
        authorityEs: 'CCI - Cámara de Comercio Internacional'
      }
    },
    processingDays: 5,
    mandatory: false,
    status: 'optional'
  },
  {
    id: 'insurance-certificate',
    name: 'Marine/Cargo Insurance Certificate',
    nameEs: 'Certificado de Seguro Marítimo/de Carga',
    category: 'financial',
    description: 'Certificate proving cargo insurance coverage during international transport. Mandatory for CIF and CIP Incoterms where seller arranges insurance.',
    descriptionEs: 'Certificado que prueba cobertura de seguro de carga durante transporte internacional. Obligatorio para Incoterms CIF y CIP donde el vendedor contrata el seguro.',
    requiredFor: { incoterms: ['CIF', 'CIP'], direction: 'both' },
    managementLinks: {
      'AR': {
        url: 'https://www.argentina.gob.ar/superintendencia-de-seguros',
        authority: 'SSN - Superintendence of Insurance',
        authorityEs: 'SSN - Superintendencia de Seguros de la Nación'
      },
      'DEFAULT': {
        url: 'https://www.iumi.com/',
        authority: 'IUMI - International Union of Marine Insurance',
        authorityEs: 'IUMI - Unión Internacional de Seguros Marítimos'
      }
    },
    processingDays: 2,
    mandatory: true,
    status: 'conditional'
  }
];

/**
 * Get required documents for a specific trade route
 */
export function getRequiredDocuments(params: {
  hsCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  incoterm?: string;
  direction?: 'import' | 'export';
}): RequiredDocument[] {
  const { hsCode, incoterm, direction } = params;
  
  return documentsDatabase.filter(doc => {
    // Check direction
    if (doc.requiredFor.direction && direction) {
      if (doc.requiredFor.direction !== 'both' && doc.requiredFor.direction !== direction) {
        return false;
      }
    }
    
    // Check HS Code (first 2 digits)
    if (doc.requiredFor.hsCodes && hsCode) {
      const hsPrefix = hsCode.substring(0, 2);
      if (!doc.requiredFor.hsCodes.includes(hsPrefix)) {
        return false;
      }
    }
    
    // Check Incoterm
    if (doc.requiredFor.incoterms && incoterm) {
      if (!doc.requiredFor.incoterms.includes(incoterm)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Group documents by category
 */
export function groupDocumentsByCategory(docs: RequiredDocument[]): Record<string, RequiredDocument[]> {
  return docs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, RequiredDocument[]>);
}

/**
 * Get management link for a document based on country
 */
export function getManagementLink(doc: RequiredDocument, countryCode?: string): { url: string; authority: string; authorityEs: string } {
  if (!countryCode || !doc.managementLinks[countryCode]) {
    return doc.managementLinks['DEFAULT'] || doc.managementLinks[Object.keys(doc.managementLinks)[0]];
  }
  return doc.managementLinks[countryCode];
}
