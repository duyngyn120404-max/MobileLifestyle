import { Disease } from '../types';

export const DISEASE_LIST: Disease[] = [
  {
    id: "blood-pressure",
    name: "Huyết áp",
    icon: "heart",
    color: "#FF6B6B",
    description: "Đo tâm thu và tâm trương",
    fields: [
      { name: "Tâm thu", unit: "mmHg", placeholder: "120", type: "number" },
      { name: "Tâm trương", unit: "mmHg", placeholder: "80", type: "number" },
    ],
  },
  {
    id: "diabetes",
    name: "Đái tháo đường",
    icon: "beaker",
    color: "#FFA500",
    description: "Đo đường huyết",
    fields: [
      { name: "Đường huyết", unit: "mg/dL", placeholder: "100", type: "decimal" },
      { name: "HbA1c", unit: "%", placeholder: "5.5", type: "decimal" },
    ],
  },
  {
    id: "cholesterol",
    name: "Mỡ máu",
    icon: "test-tube",
    color: "#4ECDC4",
    description: "Đo cholesterol và triglycerides",
    fields: [
      { name: "Cholesterol tổng", unit: "mg/dL", placeholder: "200", type: "number" },
      { name: "Triglycerides", unit: "mg/dL", placeholder: "150", type: "number" },
      { name: "LDL", unit: "mg/dL", placeholder: "100", type: "number" },
      { name: "HDL", unit: "mg/dL", placeholder: "50", type: "number" },
    ],
  },
  {
    id: "weight",
    name: "Cân nặng",
    icon: "scale",
    color: "#95E1D3",
    description: "Theo dõi cân nặng và BMI",
    fields: [
      { name: "Cân nặng", unit: "kg", placeholder: "70", type: "decimal" },
      { name: "Chiều cao", unit: "cm", placeholder: "170", type: "number" },
    ],
  },
  {
    id: "exercise",
    name: "Vận động",
    icon: "run",
    color: "#A8E6CF",
    description: "Theo dõi hoạt động thể chất",
    fields: [
      { name: "Bước đi", unit: "steps", placeholder: "10000", type: "number" },
      { name: "Calo tiêu thụ", unit: "kcal", placeholder: "2500", type: "number" },
      { name: "Thời gian tập luyện", unit: "phút", placeholder: "30", type: "number" },
    ],
  },
  {
    id: "sleep",
    name: "Giấc ngủ",
    icon: "sleep",
    color: "#FFD3B6",
    description: "Theo dõi chất lượng giấc ngủ",
    fields: [
      { name: "Thời gian ngủ", unit: "giờ", placeholder: "8", type: "decimal" },
      { name: "Chất lượng", unit: "1-10", placeholder: "8", type: "number" },
    ],
  },
];

export const HEALTH_STATS = [
  { label: "Bản ghi", value: "24", color: "#FF6B6B", icon: "clipboard-list" },
  { label: "Mục tiêu", value: "8", color: "#4ECDC4", icon: "target" },
  { label: "Streaks", value: "7 ngày", color: "#95E1D3", icon: "fire" },
];

export const HEALTH_WARNINGS = [
  {
    type: "warning" as const,
    title: "Huyết áp cao",
    description: "Huyết áp của bạn vượt quá mức bình thường (140/90)",
    color: "#FF6B6B",
    icon: "alert-circle"
  },
  {
    type: "info" as const,
    title: "Cần theo dõi đường huyết",
    description: "Bạn chưa nhập dữ liệu đường huyết trong 3 ngày",
    color: "#FFA500",
    icon: "information"
  },
  {
    type: "success" as const,
    title: "Giấc ngủ tốt",
    description: "Bạn đã ngủ đủ 8 giờ hôm qua",
    color: "#34C759",
    icon: "check-circle"
  },
];
