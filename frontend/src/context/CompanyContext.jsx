import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as companyApi from '../api/companyApi.js';
import { isSafeLogoSrc } from '../utils/inrFormat.js';
import { useAuth } from './AuthContext.jsx';

const CompanyContext = createContext(null);

const DEFAULT_COMPANY = {
  companyName: 'Codenap IT Services Private Limited',
  tagline: 'PROFESSIONAL IT SERVICES',
  address: '',
  contactEmail: 'info@codenap.co.in',
  website: 'https://codenap.in/',
  signatoryName: 'Authorized Signatory',
  receiptPrefix: 'CNP',
  logoUrl: '',
  logoData: '',
  receiptLogoUrl: '',
  receiptLogoData: '',
};

function resolveSafeSlotSrc(dataUri, url, endpointPrefix, revision) {
  if (isSafeLogoSrc(dataUri)) {
    return dataUri;
  }
  if (isSafeLogoSrc(url)) {
    if (url.startsWith(endpointPrefix)) {
      return `${url}?v=${revision}`;
    }
    return url;
  }
  return '';
}

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [logoRevision, setLogoRevision] = useState(0);

  const refreshCompany = useCallback(async () => {
    if (!user) {
      setCompany(DEFAULT_COMPANY);
      setCompanyError('');
      return null;
    }

    setLoadingCompany(true);
    setCompanyError('');
    try {
      const data = await companyApi.fetchCompanySettings();
      if (data?.company) {
        setCompany(data.company);
      }
      return data?.company || null;
    } catch (err) {
      setCompanyError(err.message || 'Unable to load company settings.');
      return null;
    } finally {
      setLoadingCompany(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  const applyCompanyUpdate = useCallback((data) => {
    if (data?.company) {
      setCompany(data.company);
      setLogoRevision((rev) => rev + 1);
    }
    return data?.company;
  }, []);

  const saveCompanyDetails = useCallback(
    async (updates) => applyCompanyUpdate(await companyApi.updateCompanySettings(updates)),
    [applyCompanyUpdate]
  );

  const uploadLogo = useCallback(
    async (file) => applyCompanyUpdate(await companyApi.uploadCompanyLogo(file)),
    [applyCompanyUpdate]
  );

  const removeLogo = useCallback(
    async () => applyCompanyUpdate(await companyApi.resetCompanyLogo()),
    [applyCompanyUpdate]
  );

  const uploadReceiptLogo = useCallback(
    async (file) => applyCompanyUpdate(await companyApi.uploadReceiptLogo(file)),
    [applyCompanyUpdate]
  );

  const removeReceiptLogo = useCallback(
    async () => applyCompanyUpdate(await companyApi.resetReceiptLogo()),
    [applyCompanyUpdate]
  );

  const logoSrc = useMemo(
    () =>
      resolveSafeSlotSrc(
        company?.logoData,
        company?.logoUrl,
        '/api/company/logo',
        logoRevision
      ),
    [company?.logoData, company?.logoUrl, logoRevision]
  );

  const receiptLogoSrc = useMemo(
    () =>
      resolveSafeSlotSrc(
        company?.receiptLogoData,
        company?.receiptLogoUrl,
        '/api/company/receipt-logo',
        logoRevision
      ),
    [company?.receiptLogoData, company?.receiptLogoUrl, logoRevision]
  );

  return (
    <CompanyContext.Provider
      value={{
        company,
        logoSrc,
        receiptLogoSrc,
        loadingCompany,
        companyError,
        refreshCompany,
        saveCompanyDetails,
        uploadLogo,
        removeLogo,
        uploadReceiptLogo,
        removeReceiptLogo,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error('useCompany must be used inside a CompanyProvider.');
  }
  return ctx;
}
