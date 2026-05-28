import { healthRepository, HealthRecord, CreateHealthRecord } from '@/src/repositories/health.repository';
import type { Disease } from '@/src/types';

export interface SubmitHealthDataInput {
  userId: string;
  disease: Disease;
  formData: Record<string, string>;
}

export const healthService = {
  async getRecords(userId: string, days: number = 30): Promise<HealthRecord[]> {
    const { data, error } = await healthRepository.findByUserId(userId, days);
    if (error) throw error;
    return data ?? [];
  },

  async submitRecord(input: SubmitHealthDataInput): Promise<HealthRecord> {
    const { userId, disease, formData } = input;

    const record: CreateHealthRecord = {
      user_id: userId,
      disease_id: disease.id,
      disease_name: disease.name,
      record_date: new Date().toISOString(),
      value1: parseFloat(formData[disease.fields[0]?.name]) || 0,
      unit1: disease.fields[0]?.unit ?? '',
    };

    disease.fields.forEach((field, index) => {
      const fieldNum = index + 1;
      (record as any)[`value${fieldNum}`] = parseFloat(formData[field.name]) || 0;
      (record as any)[`unit${fieldNum}`] = field.unit;
    });

    const { data, error } = await healthRepository.create(record);
    if (error) throw error;
    if (!data) throw new Error('Không thể lưu bản ghi');
    return data;
  },

  async deleteRecord(recordId: string): Promise<void> {
    const { error } = await healthRepository.delete(recordId);
    if (error) throw error;
  },

  validateFormData(disease: Disease, formData: Record<string, string>): string | null {
    const emptyFields = disease.fields.filter(field => !formData[field.name]?.trim());
    if (emptyFields.length > 0) return 'Vui lòng điền đầy đủ các trường';
    return null;
  },
};
