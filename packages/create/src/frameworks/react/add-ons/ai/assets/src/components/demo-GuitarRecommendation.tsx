import { useNavigate } from '@tanstack/react-router'

import { showAIAssistant } from './demo-AIAssistant'

import guitars from '#/data/demo-guitars'

export default function GuitarRecommendation({ id }: { id: string }) {
  const navigate = useNavigate()
  const guitar = guitars.find((guitar) => guitar.id === +id)
  if (!guitar) {
    return null
  }
  return (
    <div className="demo-card my-4 overflow-hidden p-0">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={guitar.image}
          alt={guitar.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
          {guitar.name}
        </h3>
        <p className="demo-muted mb-3 line-clamp-2 text-sm">
          {guitar.shortDescription}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-[var(--lagoon-deep)]">
            ${guitar.price}
          </div>
          <button
            onClick={() => {
              navigate({
                to: '/demo/guitars/$guitarId',
                params: { guitarId: guitar.id.toString() },
              })
              showAIAssistant.setState(() => false)
            }}
            className="demo-button px-4 py-1.5 text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
