import { aiProxyClient } from "@/src/api/aiProxyClient";
import type { RiskProfile } from "@/src/features/health/types/health.types";
import { normalizeRiskProfileRequest } from "@/src/features/health/validation/health.validation";
import { useCallback, useMemo, useState } from "react";

const EMPTY_PROFILE: RiskProfile = {
  riskFactors: [],
  hmodItems: [],
  cardiovascularDiseases: [],
};

export function useRiskProfile() {
  const [profile, setProfile] = useState<RiskProfile>(EMPTY_PROFILE);
  const [initialProfile, setInitialProfile] = useState<RiskProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiProxyClient.getRiskProfile();
      setProfile(data);
      setInitialProfile(data);
      return data;
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể tải hồ sơ nguy cơ",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setField = useCallback(
    <K extends keyof Pick<RiskProfile, "riskFactors" | "hmodItems" | "cardiovascularDiseases">>(
      field: K,
      values: RiskProfile[K],
    ) => {
      setProfile((current) => ({ ...current, [field]: values }));
    },
    [],
  );

  const resetChanges = useCallback(() => setProfile(initialProfile), [initialProfile]);

  const saveProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiProxyClient.saveRiskProfile(
        normalizeRiskProfileRequest(profile),
      );
      setProfile(data);
      setInitialProfile(data);
      return data;
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể lưu hồ sơ",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(normalizeRiskProfileRequest(profile)) !==
      JSON.stringify(normalizeRiskProfileRequest(initialProfile)),
    [initialProfile, profile],
  );

  return { profile, loading, error, loadProfile, setField, resetChanges, saveProfile, hasChanges };
}
