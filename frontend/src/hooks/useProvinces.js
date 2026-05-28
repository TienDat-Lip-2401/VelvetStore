import { useState, useEffect, useCallback } from 'react';

const BASE_URL = 'https://provinces.open-api.vn/api';

const useProvinces = () => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${BASE_URL}/p/`);
        const data = await res.json();
        setProvinces(data);
      } catch {
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const fetchDistricts = useCallback(async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts || []);
      setWards([]);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const fetchWards = useCallback(async (districtCode) => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    try {
      const res = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
      const data = await res.json();
      setWards(data.wards || []);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  return {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    fetchDistricts,
    fetchWards,
  };
};

export default useProvinces;
