import { AlertTriangle } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">医疗免责声明</p>
          <p className="mt-1 text-amber-600">
            本工具仅供参考，不构成医疗建议。如有严重皮肤问题，请咨询专业皮肤科医生。
          </p>
        </div>
      </div>
    </div>
  );
}
