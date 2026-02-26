import { ArrowDown, FileSearch, User, Wand2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface Category {
  id: string
  name: string
}

interface ExtractionFlowDesignerProps {
  settings: Record<string, string>
  openaiTextModels: string[]
  openaiImageModels: string[]
  googleTextModels: string[]
  googleImageModels: string[]
  categories?: Category[]
  onSelect: (key: string, value: string) => void
}

export function ExtractionFlowDesigner({
  settings,
  openaiTextModels,
  openaiImageModels,
  googleTextModels,
  googleImageModels,
  categories,
  onSelect,
}: ExtractionFlowDesignerProps) {
  const steps = [
    {
      id: 'analyze',
      key: 'step_analyze_model',
      title: 'Analyze Image',
      description: 'Analyze equipments from the input image.',
      icon: <FileSearch className="w-5 h-5 text-cyan-600" />,
      type: 'text',
    },
    {
      id: 'extract',
      key: 'step_refine_model',
      title: 'Extract Asset',
      description: 'Extracts and isolates each equipment piece.',
      icon: <Wand2 className="w-5 h-5 text-emerald-600" />,
      type: 'image',
    },
    {
      id: 'generation',
      key: 'step_generation_model',
      title: 'Character Generation',
      description: 'Generates the final character using the equipments.',
      icon: <User className="w-5 h-5 text-blue-600" />,
      type: 'image',
    },
  ]

  return (
    <div className="relative py-8">
      {/* Vertical Line */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-500/20 via-blue-500/20 to-purple-500/20 z-0" />

      <div className="flex flex-col gap-6 relative z-10">
        {steps.map((step, index) => {
          const textModels =
            step.type === 'text'
              ? { openai: openaiTextModels, google: googleTextModels }
              : { openai: openaiImageModels, google: googleImageModels }

          return (
            <div key={step.id} className="group relative flex gap-6 items-start">
              {/* Icon Bubble */}
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 group-hover:border-cyan-400">
                {step.icon}
              </div>

              {/* Card */}
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs">0{index + 1} //</span>
                      {step.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                  </div>

                  <div className="w-full md:w-64">
                    {step.id !== 'extract' && (
                      <ModelSelect
                        value={settings[step.key]}
                        openaiModels={textModels.openai}
                        googleModels={textModels.google}
                        onSelect={(val) => onSelect(step.key, val)}
                      />
                    )}
                  </div>
                </div>

                {step.id === 'extract' && categories && categories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="space-y-3 pl-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"
                        >
                          <span className="text-sm text-slate-600 font-medium">{cat.name}</span>
                          <div className="w-full md:w-64">
                            <ModelSelect
                              value={settings[`step_extract_cat_${cat.id}_model`]}
                              openaiModels={openaiImageModels}
                              googleModels={googleImageModels}
                              onSelect={(val) => onSelect(`step_extract_cat_${cat.id}_model`, val)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow Connection (except last) */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 -bottom-6 transform -translate-x-1/2 text-slate-300">
                  <ArrowDown size={16} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ModelSelect({
  value,
  openaiModels,
  googleModels,
  onSelect,
}: {
  value?: string
  openaiModels: string[]
  googleModels: string[]
  onSelect: (val: string) => void
}) {
  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger className="w-full bg-slate-50 border-slate-200">
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent>
        {openaiModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-mono uppercase tracking-wider text-slate-400">
              OpenAI
            </SelectLabel>
            {openaiModels.map((m) => (
              <SelectItem key={`openai:${m}`} value={`openai:${m}`}>
                {m}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {googleModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Google
            </SelectLabel>
            {googleModels.map((m) => (
              <SelectItem key={`google:${m}`} value={`google:${m}`}>
                {m}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}
