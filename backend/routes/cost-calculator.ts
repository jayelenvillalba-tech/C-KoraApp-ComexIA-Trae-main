import { Request, Response } from 'express';
import { db } from '../../database/db-sqlite.js';
import { hsSubpartidas } from '../../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { countries, getCountryTreaties, getTariffReduction } from '../../shared/countries-data.js';
import { getFreightQuote, FreightQuoteRequest, TransportMode, UrgencyLevel, getPortByLocode } from '../services/freightCalculator.js';
import { getExchangeRates } from '../services/exchangeRate.js';

interface CostCalculationRequest {
  fobValue: number;
  weight: number;
  volume?: number;
  destination: string; // locode (e.g., ARBUE)
  origin: string; // locode (e.g., NLRTM)
  transport: TransportMode;
  hsCode: string;
  incoterm: string;
  urgency: UrgencyLevel;
}

interface CostBreakdown {
  fob: number;
  freight: number;
  insurance: number;
  cif: number;
  tariff: number;
  vat: number;
  statistics: number;
  clearance: number;
  portHandling: number;
  documentation: number;
  inspection: number;
  storage: number;
  localTransport: number;
  brokerFees: number;
  bankCharges: number;
  contingency: number;
  total: number;
  perUnit: number;
  costAnalysis: {
    logisticsCosts: number;
    taxesAndDuties: number;
    regulatoryCosts: number;
    serviceFees: number;
  };
  savingsOpportunities?: {
    tradeAgreementSavings: number;
    volumeDiscounts: number;
    alternativeRoutes: number;
  };
}

export async function calculateCosts(req: Request, res: Response) {
  try {
    const {
      fobValue,
      weight,
      volume = 0,
      destination,
      origin,
      transport,
      hsCode,
      incoterm,
      urgency
    } = req.body as CostCalculationRequest;

    // Validate required fields
    if (!fobValue || !weight || !destination || !origin || !hsCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fobValue, weight, destination, origin, hsCode'
      });
    }

    // Get HS code data for tariff information
    const hsCodeData = await db.query.hsSubpartidas.findFirst({
      where: eq(hsSubpartidas.code, hsCode)
    });

    if (!hsCodeData) {
      return res.status(404).json({
        success: false,
        error: `HS code ${hsCode} not found`
      });
    }

    const originPort = getPortByLocode(origin);
    const destPort = getPortByLocode(destination);

    if (!originPort || !destPort) {
      return res.status(400).json({
        success: false,
        error: `Invalid origin or destination LOCODE.`
      });
    }

    // Get destination country code
    const destinationCountry = destPort.countryCode;
    const originCountryCode = originPort.countryCode;

    // Calculate base tariff rate
    let baseTariffRate = hsCodeData.tariffRate || 10; // Default 10% if not specified

    // Check for trade agreement reductions
    const destinationCountryData = countries.find(c => c.code === destinationCountry);
    const originCountryData = countries.find(c => c.code === originCountryCode);
    
    let tariffReduction = 0;
    let tradeAgreementSavings = 0;

    if (destinationCountryData && originCountryData) {
      const treaties = getCountryTreaties(destinationCountry);
      tariffReduction = getTariffReduction(hsCode, destinationCountry, treaties);
      
      // Calculate savings from trade agreements
      const originalTariff = fobValue * (baseTariffRate / 100);
      const reducedTariff = fobValue * ((baseTariffRate - tariffReduction) / 100);
      tradeAgreementSavings = originalTariff - reducedTariff;
    }

    // Apply tariff reduction
    const effectiveTariffRate = Math.max(0, baseTariffRate - tariffReduction);

    // 1. FOB Value (base value)
    const fob = fobValue;

    // 2 & 3. Freight and Insurance via Freight Calculator Service
    const freightReq: FreightQuoteRequest = {
      originLocode: origin,
      destinationLocode: destination,
      transportMode: transport,
      weightKg: weight,
      volumeCbm: volume,
      urgency,
      cargoValue: fobValue
    };
    const freightQuote = await getFreightQuote(freightReq);

    const freight = freightQuote.baseFreightUsd + freightQuote.surcharges.reduce((sum, s) => sum + s.amountUsd, 0);
    const insurance = freightQuote.insuranceUsd;

    // 4. CIF Value (Cost, Insurance, Freight)
    const cif = fob + freight + insurance;

    // 5. Import Tariff (based on CIF and effective tariff rate)
    const tariff = cif * (effectiveTariffRate / 100);

    // 6. VAT (21% on CIF + Tariff) - Argentina standard (We can make this dynamic later based on country)
    const vatRate = destinationCountry === 'AR' ? 0.21 : 0.19; // simplified logic
    const vat = (cif + tariff) * vatRate;

    // 7. Statistical Tax (3% on CIF) - mostly Argentina
    const statistics = destinationCountry === 'AR' ? cif * 0.03 : 0;

    // 8. Customs Clearance (fixed fee + percentage)
    const clearance = 200 + (cif * 0.005);

    // 9. Port Handling (based on weight and volume)
    const portHandling = Math.max(weight * 0.15, volume * 50);

    // 10. Documentation fees
    const documentation = 150;

    // 11. Inspection fees (if applicable)
    const inspection = hsCodeData.restrictions && hsCodeData.restrictions.length > 0 ? 300 : 0;

    // 12. Storage (based on urgency)
    const storageDays = urgency === 'urgent' ? 2 : urgency === 'express' ? 5 : 10;
    const storage = storageDays * 25;

    // 13. Local transport (from port to warehouse)
    const localTransport = 250 + (weight * 0.08);

    // 14. Broker fees
    const brokerFees = cif * 0.015;

    // 15. Bank charges
    const bankCharges = 100;

    // 16. Contingency (2% of total costs so far)
    const subtotal = fob + freight + insurance + tariff + vat + statistics + 
                     clearance + portHandling + documentation + inspection + 
                     storage + localTransport + brokerFees + bankCharges;
    const contingency = subtotal * 0.02;

    // Total cost
    const total = subtotal + contingency;

    // Per unit cost
    const perUnit = total / weight;

    // Cost analysis breakdown
    const logisticsCosts = freight + portHandling + storage + localTransport;
    const taxesAndDuties = tariff + vat + statistics;
    const regulatoryCosts = clearance + documentation + inspection;
    const serviceFees = brokerFees + bankCharges + contingency;

    // Calculate additional savings opportunities
    const volumeDiscounts = weight > 1000 ? freight * 0.15 : 0; // 15% discount for >1 ton
    const alternativeRoutes = freightQuote.alternatives && freightQuote.alternatives.length > 0 ? freightQuote.alternatives[0].savingsUsd : 0; 

    const breakdown: CostBreakdown = {
      fob,
      freight,
      insurance,
      cif,
      tariff,
      vat,
      statistics,
      clearance,
      portHandling,
      documentation,
      inspection,
      storage,
      localTransport,
      brokerFees,
      bankCharges,
      contingency,
      total,
      perUnit,
      costAnalysis: {
        logisticsCosts,
        taxesAndDuties,
        regulatoryCosts,
        serviceFees
      },
      savingsOpportunities: {
        tradeAgreementSavings,
        volumeDiscounts,
        alternativeRoutes
      }
    };

    // Get exchange rate for the response if the user wants it
    const exchangeRates = await getExchangeRates();

    res.json({
      success: true,
      breakdown,
      freightDetails: freightQuote,
      metadata: {
        hsCode,
        hsCodeDescription: hsCodeData.description,
        originLocode: origin,
        destinationLocode: destination,
        transport,
        urgency,
        baseTariffRate,
        effectiveTariffRate,
        tariffReduction,
        treaties: destinationCountryData?.treaties || [],
        exchangeRates: exchangeRates.rates
      }
    });

  } catch (error: any) {
    console.error('Cost calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate costs',
      details: error.message
    });
  }
}
