import { useAuth } from "@/src/contexts/auth-context";
import { homeHealthService } from "@/src/services/home-health.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  HelperText,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

const MEDICAL_COLORS = {
  background: "#F4F8F8",
  surface: "#FCFEFE",
  surfaceSoft: "#EEF6F6",
  surfaceSoft2: "#E7F1F2",
  primary: "#0E7490",
  primaryDark: "#0B5F73",
  text: "#16323A",
  textMuted: "#5B737B",
  border: "#D8E7E8",
  success: "#1F9D73",
  warning: "#E9A23B",
  danger: "#C75656",
};

const riskOptions = [
  { key: "diabetes", label: "Đái tháo đường" },
  { key: "smoking", label: "Hút thuốc lá" },
  { key: "overweight", label: "Thừa cân hoặc béo phì" },
  { key: "heartRateOver80", label: "Nhịp tim trên 80 lần/phút" },
  { key: "highLDLOrTriglyceride", label: "Mỡ máu cao" },
  { key: "familyHistoryOfHypertension", label: "Gia đình có THA" },
];

const hmodOptions = [
  { key: "leftVentricularHypertrophy", label: "Phì đại thất trái" },
  { key: "brainDamage", label: "Tổn thương não" },
  { key: "heartDamage", label: "Tổn thương tim" },
  { key: "kidneyDamage", label: "Tổn thương thận" },
];

const cvdOptions = [
  { key: "coronaryArteryDisease", label: "Bệnh động mạch vành" },
  { key: "heartFailure", label: "Suy tim" },
  { key: "stroke", label: "Đột quỵ" },
  { key: "atrialFibrillation", label: "Rung nhĩ" },
];

const symptomOptions = [
  "Đau đầu",
  "Chóng mặt",
  "Mệt mỏi",
  "Hồi hộp",
  "Khó thở",
  "Đau ngực",
];

const medicationOptions = [
  "Amlodipine",
  "Losartan",
  "Valsartan",
  "Bisoprolol",
  "Perindopril",
];

const stages = [
  {
    key: "measurement",
    title: "Đo huyết áp",
    subtitle: "Nhập chỉ số đo chính của lần đo hiện tại",
    icon: "heart-pulse",
  },
  {
    key: "context",
    title: "Bối cảnh đo",
    subtitle: "Nguồn đo, thời điểm, tư thế và thiết bị",
    icon: "stethoscope",
  },
  {
    key: "clinical",
    title: "Hồ sơ nguy cơ",
    subtitle: "Nguy cơ, tổn thương cơ quan đích, bệnh liên quan",
    icon: "head-heart",
  },
  {
    key: "status",
    title: "Triệu chứng & thuốc",
    subtitle: "Biểu hiện hiện tại và thuốc đang sử dụng",
    icon: "pill-multiple",
  },
] as const;

type StageKey = (typeof stages)[number]["key"];

export default function HomeScreen() {
  const { user } = useAuth();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    "bạn";

  const [currentStage, setCurrentStage] = useState<StageKey>("measurement");

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bpSource, setBpSource] = useState<"HBPM" | "OBPM" | "ABPM">("HBPM");
  const [dayPeriod, setDayPeriod] = useState<
    "morning" | "evening" | "day" | "night"
  >("morning");
  const [position, setPosition] = useState<"sitting" | "standing" | "lying">(
    "sitting",
  );
  const [restedMinutes, setRestedMinutes] = useState("");
  const [deviceType, setDeviceType] = useState<"upper_arm" | "wrist">(
    "upper_arm",
  );
  const [deviceValidated, setDeviceValidated] = useState(true);
  const [measuredAt, setMeasuredAt] = useState("");

  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [hmodItems, setHmodItems] = useState<string[]>([]);
  const [cardiovascularDiseases, setCardiovascularDiseases] = useState<
    string[]
  >([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);

  const [customSymptom, setCustomSymptom] = useState("");
  const [customMedication, setCustomMedication] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);

  const stageAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

  useEffect(() => {
    stageAnim.setValue(0);
    Animated.timing(stageAnim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentStage, stageAnim]);

  const stageIndex = stages.findIndex((item) => item.key === currentStage);
  const progress = ((stageIndex + 1) / stages.length) * 100;

  const measurementDone = Boolean(systolic && diastolic);
  const contextDone = Boolean(bpSource && dayPeriod && position && deviceType);
  const clinicalDone =
    riskFactors.length > 0 ||
    hmodItems.length > 0 ||
    cardiovascularDiseases.length > 0;
  const statusDone = symptoms.length > 0 || medications.length > 0;

  const stageCompletionMap: Record<StageKey, boolean> = {
    measurement: measurementDone,
    context: contextDone,
    clinical: clinicalDone,
    status: statusDone,
  };

  const summaryText = useMemo(() => {
    const selectedCount =
      riskFactors.length +
      hmodItems.length +
      cardiovascularDiseases.length +
      symptoms.length +
      medications.length;

    if (!systolic || !diastolic) {
      return "Hãy bắt đầu bằng việc nhập chỉ số huyết áp để hệ thống có cơ sở lưu hồ sơ sức khỏe.";
    }

    if (selectedCount === 0) {
      return `Bạn đã nhập ${systolic}/${diastolic} mmHg. Có thể bổ sung thêm bối cảnh lâm sàng để dữ liệu hữu ích hơn về sau.`;
    }

    return `Bạn đã hoàn thiện hồ sơ khá đầy đủ cho lần đo ${systolic}/${diastolic} mmHg với ${selectedCount} thông tin bổ sung.`;
  }, [
    systolic,
    diastolic,
    riskFactors.length,
    hmodItems.length,
    cardiovascularDiseases.length,
    symptoms.length,
    medications.length,
  ]);

  const showMessage = (message: string, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setSnackVisible(true);
  };

  const toggleItem = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const addCustomItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    reset: () => void,
  ) => {
    const normalized = value.trim();
    if (!normalized) return;

    setter((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
    reset();
  };

  const goNext = () => {
    if (stageIndex < stages.length - 1) {
      setCurrentStage(stages[stageIndex + 1].key);
    }
  };

  const goBack = () => {
    if (stageIndex > 0) {
      setCurrentStage(stages[stageIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      showMessage("Vui lòng đăng nhập trước khi lưu dữ liệu", true);
      return;
    }

    if (!systolic || !diastolic) {
      showMessage("Vui lòng nhập đầy đủ tâm thu và tâm trương", true);
      setCurrentStage("measurement");
      return;
    }

    try {
      setIsSubmitting(true);

      await homeHealthService.submitSimpleForm({
        userId: user.id,
        systolic,
        diastolic,
        bpSource,
        dayPeriod,
        position,
        restedMinutes,
        deviceType,
        deviceValidated,
        measuredAt,
        riskFactors,
        hmodItems,
        cardiovascularDiseases,
        symptoms,
        medications,
        source: "user",
      });

      showMessage("Đã lưu thành công dữ liệu sức khỏe");
      Alert.alert("Thành công", "Dữ liệu đã được lưu thành công.");
    } catch (error) {
      console.error("SUBMIT_SIMPLE_HOME_HEALTH_ERROR", error);
      const message =
        error instanceof Error ? error.message : "Không thể lưu dữ liệu";
      showMessage(message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case "measurement":
        return (
          <Card style={styles.stageCard}>
            <Card.Content>
              <SectionHeading
                title="Chỉ số huyết áp"
                subtitle="Nhập hai chỉ số cốt lõi của lần đo hiện tại."
              />

              <View style={styles.bpRow}>
                <View style={styles.bpField}>
                  <Text style={styles.fieldLabel}>Tâm thu</Text>
                  <TextInput
                    value={systolic}
                    onChangeText={setSystolic}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ví dụ 128"
                    style={styles.textInput}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Affix text="mmHg" />}
                  />
                </View>

                <View style={styles.bpField}>
                  <Text style={styles.fieldLabel}>Tâm trương</Text>
                  <TextInput
                    value={diastolic}
                    onChangeText={setDiastolic}
                    keyboardType="numeric"
                    mode="outlined"
                    placeholder="Ví dụ 82"
                    style={styles.textInput}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Affix text="mmHg" />}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Thời gian đo cụ thể</Text>
              <TextInput
                value={measuredAt}
                onChangeText={setMeasuredAt}
                mode="outlined"
                placeholder="2026-04-29 11:30"
                style={styles.textInput}
                outlineStyle={styles.inputOutline}
              />
              <HelperText type="info" style={styles.helperText}>
                Bạn có thể để trống nếu muốn dùng thời điểm lưu hiện tại.
              </HelperText>
            </Card.Content>
          </Card>
        );

      case "context":
        return (
          <Card style={styles.stageCard}>
            <Card.Content>
              <SectionHeading
                title="Bối cảnh của lần đo"
                subtitle="Thông tin này giúp giải thích kết quả chính xác hơn."
              />

              <Text style={styles.groupLabel}>Nguồn đo</Text>
              <View style={styles.choiceWrap}>
                {["HBPM", "OBPM", "ABPM"].map((item) => (
                  <SelectChip
                    key={item}
                    label={item}
                    selected={bpSource === item}
                    onPress={() =>
                      setBpSource(item as "HBPM" | "OBPM" | "ABPM")
                    }
                  />
                ))}
              </View>

              <Text style={styles.groupLabel}>Thời điểm đo</Text>
              <View style={styles.choiceWrap}>
                {[
                  { label: "Sáng", value: "morning" },
                  { label: "Tối", value: "evening" },
                  { label: "Ban ngày", value: "day" },
                  { label: "Ban đêm", value: "night" },
                ].map((item) => (
                  <SelectChip
                    key={item.value}
                    label={item.label}
                    selected={dayPeriod === item.value}
                    onPress={() =>
                      setDayPeriod(
                        item.value as "morning" | "evening" | "day" | "night",
                      )
                    }
                  />
                ))}
              </View>

              <Text style={styles.groupLabel}>Tư thế đo</Text>
              <View style={styles.choiceWrap}>
                {[
                  { label: "Ngồi", value: "sitting" },
                  { label: "Đứng", value: "standing" },
                  { label: "Nằm", value: "lying" },
                ].map((item) => (
                  <SelectChip
                    key={item.value}
                    label={item.label}
                    selected={position === item.value}
                    onPress={() =>
                      setPosition(
                        item.value as "sitting" | "standing" | "lying",
                      )
                    }
                  />
                ))}
              </View>

              <Text style={styles.groupLabel}>Loại máy</Text>
              <View style={styles.choiceWrap}>
                {[
                  { label: "Bắp tay", value: "upper_arm" },
                  { label: "Cổ tay", value: "wrist" },
                ].map((item) => (
                  <SelectChip
                    key={item.value}
                    label={item.label}
                    selected={deviceType === item.value}
                    onPress={() =>
                      setDeviceType(item.value as "upper_arm" | "wrist")
                    }
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Số phút nghỉ trước khi đo</Text>
              <TextInput
                value={restedMinutes}
                onChangeText={setRestedMinutes}
                keyboardType="numeric"
                mode="outlined"
                placeholder="Ví dụ 5"
                style={styles.textInput}
                outlineStyle={styles.inputOutline}
              />

              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchTitle}>Máy đã được kiểm định</Text>
                  <Text style={styles.switchSubtitle}>
                    Nên bật nếu đây là thiết bị đáng tin cậy bạn thường dùng.
                  </Text>
                </View>
                <Switch
                  value={deviceValidated}
                  onValueChange={setDeviceValidated}
                  trackColor={{
                    false: "#CFD9DA",
                    true: "#96DBD0",
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card.Content>
          </Card>
        );

      case "clinical":
        return (
          <View style={styles.stageStack}>
            <Card style={styles.stageCard}>
              <Card.Content>
                <SectionHeading
                  title="Yếu tố nguy cơ"
                  subtitle="Các yếu tố này giúp đặt kết quả đo vào bối cảnh nguy cơ nền."
                />
                <MultiSelectSection
                  title="Nguy cơ hiện có"
                  options={riskOptions}
                  values={riskFactors}
                  onToggle={(key) =>
                    toggleItem(key, riskFactors, setRiskFactors)
                  }
                />
              </Card.Content>
            </Card>

            <Card style={styles.stageCard}>
              <Card.Content>
                <SectionHeading
                  title="Tổn thương cơ quan đích"
                  subtitle="Các tổn thương liên quan làm hồ sơ lâm sàng đầy đủ hơn."
                />
                <MultiSelectSection
                  title="Các tổn thương đã biết"
                  options={hmodOptions}
                  values={hmodItems}
                  onToggle={(key) => toggleItem(key, hmodItems, setHmodItems)}
                />
              </Card.Content>
            </Card>

            <Card style={styles.stageCard}>
              <Card.Content>
                <SectionHeading
                  title="Bệnh tim mạch liên quan"
                  subtitle="Bệnh sử nền sẽ giúp ích cho việc theo dõi sau này."
                />
                <MultiSelectSection
                  title="Bệnh sử tim mạch"
                  options={cvdOptions}
                  values={cardiovascularDiseases}
                  onToggle={(key) =>
                    toggleItem(
                      key,
                      cardiovascularDiseases,
                      setCardiovascularDiseases,
                    )
                  }
                />
              </Card.Content>
            </Card>
          </View>
        );

      case "status":
        return (
          <View style={styles.stageStack}>
            <Card style={styles.stageCard}>
              <Card.Content>
                <SectionHeading
                  title="Triệu chứng hiện tại"
                  subtitle="Chọn các biểu hiện đang có để bản ghi hữu ích hơn."
                />

                <View style={styles.choiceWrap}>
                  {symptomOptions.map((item) => (
                    <SelectChip
                      key={item}
                      label={item}
                      selected={symptoms.includes(item)}
                      onPress={() => toggleItem(item, symptoms, setSymptoms)}
                    />
                  ))}
                </View>

                <View style={styles.inlineInputRow}>
                  <TextInput
                    value={customSymptom}
                    onChangeText={setCustomSymptom}
                    mode="outlined"
                    placeholder="Thêm triệu chứng khác"
                    style={[styles.textInput, styles.inlineInput]}
                    outlineStyle={styles.inputOutline}
                  />
                  <Button
                    mode="contained-tonal"
                    onPress={() =>
                      addCustomItem(customSymptom, setSymptoms, () =>
                        setCustomSymptom(""),
                      )
                    }
                    style={styles.addButton}
                  >
                    Thêm
                  </Button>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.stageCard}>
              <Card.Content>
                <SectionHeading
                  title="Thuốc đang dùng"
                  subtitle="Ghi nhận thuốc giúp nhìn kết quả trong bối cảnh điều trị."
                />

                <View style={styles.choiceWrap}>
                  {medicationOptions.map((item) => (
                    <SelectChip
                      key={item}
                      label={item}
                      selected={medications.includes(item)}
                      onPress={() =>
                        toggleItem(item, medications, setMedications)
                      }
                    />
                  ))}
                </View>

                <View style={styles.inlineInputRow}>
                  <TextInput
                    value={customMedication}
                    onChangeText={setCustomMedication}
                    mode="outlined"
                    placeholder="Thêm thuốc khác"
                    style={[styles.textInput, styles.inlineInput]}
                    outlineStyle={styles.inputOutline}
                  />
                  <Button
                    mode="contained-tonal"
                    onPress={() =>
                      addCustomItem(customMedication, setMedications, () =>
                        setCustomMedication(""),
                      )
                    }
                    style={styles.addButton}
                  >
                    Thêm
                  </Button>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryEyebrow}>
                  Tóm tắt hồ sơ lần nhập
                </Text>
                <Text style={styles.summaryTitle}>Bạn đã gần hoàn tất</Text>
                <Text style={styles.summaryText}>{summaryText}</Text>

                <View style={styles.summaryChips}>
                  <Chip style={styles.summaryChip}>
                    Nguy cơ {riskFactors.length}
                  </Chip>
                  <Chip style={styles.summaryChip}>
                    HMOD {hmodItems.length}
                  </Chip>
                  <Chip style={styles.summaryChip}>
                    CVD {cardiovascularDiseases.length}
                  </Chip>
                  <Chip style={styles.summaryChip}>
                    Triệu chứng {symptoms.length}
                  </Chip>
                  <Chip style={styles.summaryChip}>
                    Thuốc {medications.length}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons
                name={stages[stageIndex].icon}
                size={28}
                color={MEDICAL_COLORS.primary}
              />
            </View>

            <Chip
              style={styles.progressChip}
              textStyle={styles.progressChipText}
            >
              Bước {stageIndex + 1}/{stages.length}
            </Chip>
          </View>

          <Text style={styles.heroTitle}>Nhập hồ sơ sức khỏe</Text>
          <Text style={styles.heroSubtitle}>
            Xin chào {displayName}, hãy đi từng bước để việc nhập liệu ngắn gọn,
            rõ ràng và dễ chịu hơn.
          </Text>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </Animated.View>

        <Card style={styles.stageRailCard}>
          <Card.Content>
            <Text style={styles.stageRailTitle}>Chọn giai đoạn</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stageRailContent}
            >
              {stages.map((stage, index) => {
                const active = stage.key === currentStage;
                const completed = stageCompletionMap[stage.key];

                return (
                  <Pressable
                    key={stage.key}
                    onPress={() => setCurrentStage(stage.key)}
                    style={[styles.stagePill, active && styles.stagePillActive]}
                  >
                    <View
                      style={[
                        styles.stagePillIconWrap,
                        active && styles.stagePillIconWrapActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={completed ? "check-circle" : stage.icon}
                        size={18}
                        color={
                          active
                            ? MEDICAL_COLORS.primaryDark
                            : completed
                              ? MEDICAL_COLORS.success
                              : MEDICAL_COLORS.textMuted
                        }
                      />
                    </View>

                    <View>
                      <Text
                        style={[
                          styles.stagePillTitle,
                          active && styles.stagePillTitleActive,
                        ]}
                      >
                        {index + 1}. {stage.title}
                      </Text>
                      <Text style={styles.stagePillSubtitle}>
                        {stage.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card.Content>
        </Card>

        <Animated.View
          style={{
            opacity: stageAnim,
            transform: [
              {
                translateY: stageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              {
                scale: stageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.985, 1],
                }),
              },
            ],
          }}
        >
          {renderStageContent()}
        </Animated.View>

        <View style={styles.footerActions}>
          <Button
            mode="text"
            onPress={goBack}
            disabled={stageIndex === 0}
            textColor={MEDICAL_COLORS.textMuted}
            style={styles.secondaryButton}
          >
            Quay lại
          </Button>

          {stageIndex < stages.length - 1 ? (
            <Button
              mode="contained"
              onPress={goNext}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              buttonColor={MEDICAL_COLORS.primary}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              buttonColor={MEDICAL_COLORS.primary}
            >
              Lưu dữ liệu
            </Button>
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={snackError ? 3500 : 2500}
        style={{
          backgroundColor: snackError
            ? MEDICAL_COLORS.danger
            : MEDICAL_COLORS.success,
        }}
      >
        {snackMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeadingWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function MultiSelectSection({
  title,
  options,
  values,
  onToggle,
}: {
  title: string;
  options: Array<{ key: string; label: string }>;
  values: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <View>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.choiceWrap}>
        {options.map((item) => (
          <SelectChip
            key={item.key}
            label={item.label}
            selected={values.includes(item.key)}
            onPress={() => onToggle(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectChip, selected && styles.selectChipActive]}
    >
      <Text
        style={[styles.selectChipText, selected && styles.selectChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: MEDICAL_COLORS.surface,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2F3",
  },
  progressChip: {
    backgroundColor: "#E8F6F4",
  },
  progressChipText: {
    color: MEDICAL_COLORS.primaryDark,
    fontWeight: "800",
    fontSize: 13,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E4EEEE",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: MEDICAL_COLORS.primary,
  },
  stageRailCard: {
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  stageRailTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 12,
  },
  stageRailContent: {
    gap: 10,
    paddingRight: 8,
  },
  stagePill: {
    width: 240,
    borderRadius: 18,
    padding: 14,
    backgroundColor: MEDICAL_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: "#DCE9EA",
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stagePillActive: {
    backgroundColor: "#DFF2F0",
    borderColor: "#8FD9CD",
  },
  stagePillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFB",
  },
  stagePillIconWrapActive: {
    backgroundColor: "#ECFBF8",
  },
  stagePillTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 3,
  },
  stagePillTitleActive: {
    color: MEDICAL_COLORS.primaryDark,
  },
  stagePillSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: MEDICAL_COLORS.textMuted,
    width: 165,
  },
  stageStack: {
    gap: 14,
  },
  stageCard: {
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: MEDICAL_COLORS.surface,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    overflow: "hidden",
  },
  summaryCard: {
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: "#EAF5F4",
    borderWidth: 1,
    borderColor: "#CFE7E4",
    overflow: "hidden",
  },
  sectionHeadingWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: MEDICAL_COLORS.textMuted,
  },
  bpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  bpField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  inputOutline: {
    borderRadius: 16,
    borderColor: "#D7E5E5",
  },
  helperText: {
    color: MEDICAL_COLORS.textMuted,
  },
  groupLabel: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  selectChip: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#EEF4F5",
    borderWidth: 1,
    borderColor: "#D9E8E8",
    justifyContent: "center",
  },
  selectChipActive: {
    backgroundColor: "#DDF3F0",
    borderColor: "#82D4C8",
  },
  selectChipText: {
    color: MEDICAL_COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  selectChipTextActive: {
    color: MEDICAL_COLORS.primaryDark,
  },
  switchRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: MEDICAL_COLORS.text,
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: MEDICAL_COLORS.textMuted,
  },
  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  inlineInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    borderRadius: 14,
  },
  summaryEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: MEDICAL_COLORS.primaryDark,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 23,
    color: MEDICAL_COLORS.textMuted,
    marginBottom: 14,
  },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryChip: {
    backgroundColor: "#F7FBFB",
  },
  footerActions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 18,
    backgroundColor: MEDICAL_COLORS.primary,
  },
  primaryButtonContent: {
    height: 56,
  },
});
