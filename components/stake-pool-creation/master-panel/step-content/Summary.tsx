import { PencilIcon } from '@heroicons/react/24/outline'

const summaryItems = [
  {
    label: 'Overlay label',
    value: 'Staked',
  },
  {
    label: 'Creator address',
    value: 'Cww5....u38b',
  },
  {
    label: 'Reward distributor',
    value: 'AKJ6....KYC4',
  },
  {
    label: 'Reward generation rate',
    value: '1 day',
  },
  {
    label: 'Reward amount',
    value: '0.0955',
  },
  {
    label: 'Max reward duration',
    value: 'N/A',
  },
  {
    label: 'Multiplier decimals',
    value: '5',
  },
]

export const Summary = () => {
  return (
    <div className="max-h-[350px] overflow-y-scroll">
      {summaryItems.map(({ label, value }, i) => (
        <div className="w-full py-1" key={label}>
          <div className="flex w-full items-center justify-between rounded-xl bg-gray-800 p-6">
            <div className="flex">
              <span className="text-gray-500">{label}:</span>
              <span className="ml-2 text-gray-200">{value}</span>
            </div>
            {i === 0 && <PencilIcon className="h-6 w-6 text-gray-500" />}
          </div>
        </div>
      ))}
    </div>
  )
}