import React, { useState } from 'react'
import { Trophy, Medal, Goal, Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import { useMonthlyScorers, useYearlyScorers, MONTH_NAMES } from '../hooks/useScorers'

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()

export default function Stats({ viewerId, viewerIsSuperAdmin }) {
    const [month, setMonth] = useState(CURRENT_MONTH)
    const [year, setYear] = useState(CURRENT_YEAR)
    const [yearlyYear, setYearlyYear] = useState(CURRENT_YEAR)

    const { scorers: monthlyScorers, loading: loadingMonth } = useMonthlyScorers(month, year)
    const { scorers: yearlyScorers, loading: loadingYear } = useYearlyScorers(yearlyYear)

    const prevMonth = () => {
        if (month === 1) {
            setMonth(12)
            setYear(y => y - 1)
        } else {
            setMonth(m => m - 1)
        }
    }

    const nextMonth = () => {
        if (month === 12) {
            setMonth(1)
            setYear(y => y + 1)
        } else {
            setMonth(m => m + 1)
        }
    }

    const canGoNextMonth = month < CURRENT_MONTH || year < CURRENT_YEAR

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32']
    const medalLabels = ['', '', '']

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Líderes de la Cancha
                </h2>
                <p style={{ color: 'var(--text-dim)' }}>Los mejores jugadores de la comunidad FutGO</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Monthly Scorers */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Goal size={24} style={{ color: 'var(--primary)' }} /> Goleador del Mes
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}>
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ color: 'var(--text-dim)', fontWeight: '600', minWidth: '120px', textAlign: 'center' }}>
                                {MONTH_NAMES[month - 1]} {year}
                            </span>
                            <button onClick={nextMonth} disabled={!canGoNextMonth} style={{ background: 'none', border: 'none', color: canGoNextMonth ? 'var(--primary)' : 'var(--text-dim)', cursor: canGoNextMonth ? 'pointer' : 'default', display: 'flex', opacity: canGoNextMonth ? 1 : 0.3 }}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <Card style={{ padding: '1.5rem' }} hover={false}>
                        {loadingMonth ? (
                            <div className="flex-center" style={{ padding: '2rem' }}>
                                <Loader2 size={24} className="spin" style={{ color: 'var(--primary)' }} />
                            </div>
                        ) : monthlyScorers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                No hay goles registrados en {MONTH_NAMES[month - 1].toLowerCase()} {year}.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                {monthlyScorers.slice(0, 5).map((scorer, index) => {
                                    const isTop3 = index < 3
                                    const color = isTop3 ? medalColors[index] : 'var(--text-dim)'
                                    return (
                                        <div
                                            key={scorer.player_id}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.7rem 0.8rem',
                                                background: isTop3 ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                                borderRadius: '10px',
                                                borderLeft: isTop3 ? `3px solid ${color}` : '3px solid transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    fontSize: '1rem', fontWeight: '900',
                                                    color, width: '24px', textAlign: 'center'
                                                }}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                                </span>
                                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{scorer.name}</span>
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                fontWeight: 'bold', color: 'var(--primary)',
                                                background: 'rgba(var(--primary-rgb), 0.1)',
                                                padding: '0.2rem 0.8rem', borderRadius: '20px',
                                                fontSize: '0.9rem'
                                            }}>
                                                <Goal size={14} /> {scorer.goals}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </section>

                {/* Yearly Scorers */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Star size={24} style={{ color: 'var(--primary)' }} /> Goleador del Año
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => setYearlyYear(y => y - 1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}>
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ color: 'var(--text-dim)', fontWeight: '600', minWidth: '80px', textAlign: 'center' }}>
                                {yearlyYear}
                            </span>
                            <button onClick={() => setYearlyYear(y => Math.min(y + 1, CURRENT_YEAR))} disabled={yearlyYear >= CURRENT_YEAR} style={{ background: 'none', border: 'none', color: yearlyYear < CURRENT_YEAR ? 'var(--primary)' : 'var(--text-dim)', cursor: yearlyYear < CURRENT_YEAR ? 'pointer' : 'default', display: 'flex', opacity: yearlyYear < CURRENT_YEAR ? 1 : 0.3 }}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <Card style={{ padding: '1.5rem' }} hover={false}>
                        {loadingYear ? (
                            <div className="flex-center" style={{ padding: '2rem' }}>
                                <Loader2 size={24} className="spin" style={{ color: 'var(--primary)' }} />
                            </div>
                        ) : yearlyScorers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                No hay goles registrados en {yearlyYear}.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                {yearlyScorers.slice(0, 5).map((scorer, index) => {
                                    const isTop3 = index < 3
                                    const color = isTop3 ? medalColors[index] : 'var(--text-dim)'
                                    return (
                                        <div
                                            key={scorer.player_id}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.7rem 0.8rem',
                                                background: isTop3 ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                                                borderRadius: '10px',
                                                borderLeft: isTop3 ? `3px solid ${color}` : '3px solid transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{
                                                    fontSize: '1rem', fontWeight: '900',
                                                    color, width: '24px', textAlign: 'center'
                                                }}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                                </span>
                                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{scorer.name}</span>
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                fontWeight: 'bold', color: 'var(--primary)',
                                                background: 'rgba(var(--primary-rgb), 0.1)',
                                                padding: '0.2rem 0.8rem', borderRadius: '20px',
                                                fontSize: '0.9rem'
                                            }}>
                                                <Goal size={14} /> {scorer.goals}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </section>
            </div>
        </div>
    )
}
