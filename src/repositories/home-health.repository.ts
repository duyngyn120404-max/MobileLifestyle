// import {
//   supabaseHealthApi,
//   type BpRecordInsert,
//   type ClinicalFactInsert,
// } from "@/src/config/supabaseApi";

// export interface BpRecord {
//   id: string;
//   user_id: string;
//   systolic: number;
//   diastolic: number;
//   source: string;
//   day_period: string | null;
//   position: string | null;
//   rested_minutes: number | null;
//   device_type: string | null;
//   device_validated: boolean | null;
//   status: string;
//   severity: string | null;
//   created_at: string;
// }

// export interface ClinicalFact {
//   id: string;
//   user_id: string;
//   fact_group: string;
//   fact_key: string;
//   value: boolean | string | number;
//   status: string;
//   severity: string | null;
//   source: string;
//   created_at: string;
//   updated_at: string;
// }

// export interface ReplaceClinicalFactsParams {
//   userId: string;
//   groups: string[];
//   facts: ClinicalFactInsert[];
// }

// export const homeHealthRepository = {
//   async createBpRecords(
//     records: BpRecordInsert[],
//   ): Promise<{ data: BpRecord[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.createBpRecords(records);
//       if (error) throw error;
//       return { data: (data ?? []) as BpRecord[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findBpRecordsByUserId(
//     userId: string,
//     days: number = 30,
//   ): Promise<{ data: BpRecord[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.findBpRecordsByUserId(
//         userId,
//         days,
//       );
//       if (error) throw error;
//       return { data: (data ?? []) as BpRecord[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async insertClinicalFacts(
//     facts: ClinicalFactInsert[],
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       if (!facts.length) {
//         return { data: [], error: null };
//       }

//       const { data, error } =
//         await supabaseHealthApi.insertClinicalFacts(facts);
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async deleteClinicalFactsByGroups(
//     userId: string,
//     groups: string[],
//   ): Promise<{ error: unknown }> {
//     try {
//       const { error } = await supabaseHealthApi.deleteClinicalFactsByGroups(
//         userId,
//         groups,
//       );
//       if (error) throw error;
//       return { error: null };
//     } catch (error) {
//       return { error };
//     }
//   },

//   async replaceClinicalFacts(
//     params: ReplaceClinicalFactsParams,
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       const { data, error } =
//         await supabaseHealthApi.replaceClinicalFactsByGroups(params);
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findClinicalFactsByUserId(
//     userId: string,
//     groups?: string[],
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.findClinicalFactsByUserId(
//         userId,
//         groups,
//       );
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },
// };

// import {
//   supabaseHealthApi,
//   type BpRecordDateRangeInput,
//   type BpRecordInsert,
//   type BpRecordUpdate,
//   type ClinicalFactInsert,
// } from "@/src/config/supabaseApi";

// export interface BpRecord {
//   id: string;
//   user_id: string;
//   systolic: number;
//   diastolic: number;
//   source: string;
//   day_period: string | null;
//   position: string | null;
//   rested_minutes: number | null;
//   device_type: string | null;
//   device_validated: boolean | null;
//   status: string;
//   created_at: string;
// }

// export interface ClinicalFact {
//   id: string;
//   user_id: string;
//   fact_group: string;
//   fact_key: string;
//   value: boolean | string | number;
//   status: string;
//   source: string;
//   created_at: string;
//   updated_at: string;
// }

// export interface ReplaceClinicalFactsParams {
//   userId: string;
//   groups: string[];
//   facts: ClinicalFactInsert[];
// }

// export const homeHealthRepository = {
//   async createBpRecords(
//     records: BpRecordInsert[],
//   ): Promise<{ data: BpRecord[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.createBpRecords(records);
//       if (error) throw error;
//       return { data: (data ?? []) as BpRecord[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async createBpRecord(
//     record: BpRecordInsert,
//   ): Promise<{ data: BpRecord | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.createBpRecord(record);
//       if (error) throw error;
//       return { data: (data?.[0] as BpRecord) ?? null, error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findBpRecordsByUserId(
//     userId: string,
//     days: number = 30,
//   ): Promise<{ data: BpRecord[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.findBpRecordsByUserId(
//         userId,
//         days,
//       );
//       if (error) throw error;
//       return { data: (data ?? []) as BpRecord[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findBpRecordsByDateRange(
//     input: BpRecordDateRangeInput,
//   ): Promise<{ data: BpRecord[] | null; error: unknown }> {
//     try {
//       const { data, error } =
//         await supabaseHealthApi.findBpRecordsByDateRange(input);
//       if (error) throw error;
//       return { data: (data ?? []) as BpRecord[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findBpRecordById(
//     recordId: string,
//   ): Promise<{ data: BpRecord | null; error: unknown }> {
//     try {
//       const { data, error } =
//         await supabaseHealthApi.findBpRecordById(recordId);
//       if (error) throw error;
//       return { data: (data as BpRecord) ?? null, error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async updateBpRecord(
//     recordId: string,
//     updates: BpRecordUpdate,
//   ): Promise<{ data: BpRecord | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.updateBpRecord(
//         recordId,
//         updates,
//       );
//       if (error) throw error;
//       return { data: (data as BpRecord) ?? null, error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async deleteBpRecord(recordId: string): Promise<{ error: unknown }> {
//     try {
//       const { error } = await supabaseHealthApi.deleteBpRecord(recordId);
//       if (error) throw error;
//       return { error: null };
//     } catch (error) {
//       return { error };
//     }
//   },

//   async insertClinicalFacts(
//     facts: ClinicalFactInsert[],
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       if (!facts.length) {
//         return { data: [], error: null };
//       }

//       const { data, error } =
//         await supabaseHealthApi.insertClinicalFacts(facts);
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async deleteClinicalFactsByGroups(
//     userId: string,
//     groups: string[],
//   ): Promise<{ error: unknown }> {
//     try {
//       const { error } = await supabaseHealthApi.deleteClinicalFactsByGroups(
//         userId,
//         groups,
//       );
//       if (error) throw error;
//       return { error: null };
//     } catch (error) {
//       return { error };
//     }
//   },

//   async replaceClinicalFacts(
//     params: ReplaceClinicalFactsParams,
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       const { data, error } =
//         await supabaseHealthApi.replaceClinicalFactsByGroups(params);
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },

//   async findClinicalFactsByUserId(
//     userId: string,
//     groups?: string[],
//   ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
//     try {
//       const { data, error } = await supabaseHealthApi.findClinicalFactsByUserId(
//         userId,
//         groups,
//       );
//       if (error) throw error;
//       return { data: (data ?? []) as ClinicalFact[], error: null };
//     } catch (error) {
//       return { data: null, error };
//     }
//   },
// };

import {
  supabaseHealthApi,
  type BpRecordInsert,
  type BpRecordUpdate,
  type ClinicalFactInsert,
} from "@/src/config/supabaseApi";

export interface BpRecord {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  source: string;
  day_period: string | null;
  position: string | null;
  rested_minutes: number | null;
  device_type: string | null;
  device_validated: boolean | null;
  status: string;
  severity: string | null;
  created_at: string;
}

export interface ClinicalFact {
  id: string;
  user_id: string;
  fact_group: string;
  fact_key: string;
  value: boolean | string | number;
  status: string;
  severity: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ReplaceClinicalFactsParams {
  userId: string;
  groups: string[];
  facts: ClinicalFactInsert[];
}

export const homeHealthRepository = {
  async createBpRecord(
    record: BpRecordInsert,
  ): Promise<{ data: BpRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.createBpRecord(record);
      if (error) throw error;
      return { data: (data?.[0] ?? null) as BpRecord | null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createBpRecords(
    records: BpRecordInsert[],
  ): Promise<{ data: BpRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.createBpRecords(records);
      if (error) throw error;
      return { data: (data ?? []) as BpRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateBpRecord(
    recordId: string,
    payload: BpRecordUpdate,
  ): Promise<{ data: BpRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.updateBpRecord(
        recordId,
        payload,
      );
      if (error) throw error;
      return { data: (data?.[0] ?? null) as BpRecord | null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findBpRecordsByUserId(
    userId: string,
    days: number = 30,
  ): Promise<{ data: BpRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findBpRecordsByUserId(
        userId,
        days,
      );
      if (error) throw error;
      return { data: (data ?? []) as BpRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findBpRecordsByDateRange(input: {
    userId: string;
    fromDate?: string | null;
    toDate?: string | null;
  }): Promise<{ data: BpRecord[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findBpRecordsByDateRange(
        input,
      );
      if (error) throw error;
      return { data: (data ?? []) as BpRecord[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findBpRecordById(
    recordId: string,
  ): Promise<{ data: BpRecord | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findBpRecordById(recordId);
      if (error) throw error;
      return { data: (data ?? null) as BpRecord | null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteBpRecord(recordId: string): Promise<{ error: unknown }> {
    try {
      const { error } = await supabaseHealthApi.deleteBpRecord(recordId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async insertClinicalFacts(
    facts: ClinicalFactInsert[],
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      if (!facts.length) {
        return { data: [], error: null };
      }

      const { data, error } =
        await supabaseHealthApi.insertClinicalFacts(facts);
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteClinicalFactsByGroups(
    userId: string,
    groups: string[],
  ): Promise<{ error: unknown }> {
    try {
      const { error } = await supabaseHealthApi.deleteClinicalFactsByGroups(
        userId,
        groups,
      );
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async replaceClinicalFacts(
    params: ReplaceClinicalFactsParams,
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      const { data, error } =
        await supabaseHealthApi.replaceClinicalFactsByGroups(params);
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async findClinicalFactsByUserId(
    userId: string,
    groups?: string[],
  ): Promise<{ data: ClinicalFact[] | null; error: unknown }> {
    try {
      const { data, error } = await supabaseHealthApi.findClinicalFactsByUserId(
        userId,
        groups,
      );
      if (error) throw error;
      return { data: (data ?? []) as ClinicalFact[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};