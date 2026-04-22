'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

interface TabProps {
  filters: string[]
  activeFilter: string
  onFilterChange: (filter: string, index: number) => void
  formatLabel?: (label: string) => string
}

export default function AnimatedTabs({
  filters,
  activeFilter,
  onFilterChange,
  formatLabel = (label) => label,
}: TabProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const [hoverStyle, setHoverStyle] = useState({ left: '0px', width: '0px' })
  const [activeStyle, setActiveStyle] = useState({ left: '0px', width: '0px' })

  const activeIndex = useMemo(
    () => filters.findIndex((filter) => filter === activeFilter),
    [filters, activeFilter],
  )

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex]
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement
        setHoverStyle({ left: `${offsetLeft}px`, width: `${offsetWidth}px` })
      }
    }
  }, [hoveredIndex])

  useEffect(() => {
    const update = () => {
      const index = activeIndex >= 0 ? activeIndex : 0
      const element = tabRefs.current[index]
      if (element) {
        const { offsetLeft, offsetWidth } = element
        setActiveStyle({ left: `${offsetLeft}px`, width: `${offsetWidth}px` })
      }
    }
    const raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [activeIndex])

  return (
    <div className="relative">
      <div
        className="absolute h-[30px] transition-all duration-300 ease-out bg-neutral-100 rounded-[6px] flex items-center"
        style={{
          ...hoverStyle,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />
      <div
        className="absolute h-[2px] bg-black transition-all duration-300 ease-out"
        style={{
          ...activeStyle,
          bottom: '-8px',
        }}
      />
      <div className="relative flex space-x-[6px] items-center pb-[8px]">
        {filters.map((filter, index) => (
          <div
            key={filter}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${
              activeFilter === filter
                ? 'text-neutral-900'
                : 'text-neutral-500'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onFilterChange(filter, index)}
          >
            <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
              {formatLabel(filter)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
