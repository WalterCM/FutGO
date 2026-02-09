import React, { useState, useEffect } from 'react'
import { X, User, Phone, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'
import Card from './ui/Card'

const ProfileModal = ({ show, onClose, profile, onUpdate }) => {
    const [fullName, setFullName] = useState('')
    const [nickname, setNickname] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (profile && show) {
            setFullName(profile.full_name || '')
            setNickname(profile.nickname || '')
            setPhone(profile.phone || '')
            setSuccess(false)
        }
    }, [profile, show])

    if (!show) return null

    const handleSubmit = async (e) => {
        e.preventDefault()

        const updatedFullName = fullName.trim()
        const updatedNickname = nickname.trim() || null
        const updatedPhone = phone.trim() || null

        // Check if anything actually changed
        const hasChanged =
            updatedFullName !== (profile.full_name || '') ||
            updatedNickname !== (profile.nickname || null) ||
            updatedPhone !== (profile.phone || null)

        if (!hasChanged) {
            onClose()
            return
        }

        const startTime = Date.now()
        setLoading(true)

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: updatedFullName,
                nickname: updatedNickname,
                phone: updatedPhone
            })
            .eq('id', profile.id)

        // Ensure at least 800ms of loading time for visual stability
        const duration = Date.now() - startTime
        if (duration < 800) {
            await new Promise(resolve => setTimeout(resolve, 800 - duration))
        }

        setLoading(false)
        if (!error) {
            setSuccess(true)
            if (onUpdate) onUpdate()
            setTimeout(() => {
                onClose()
            }, 2000)
        }
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <Card className="modal-content animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} /> Mi Perfil
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {success ? (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                        <CheckCircle size={48} color="var(--primary)" />
                        <p style={{ fontWeight: 'bold' }}>¡Perfil actualizado!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Nombre Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    color: 'white'
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Apodo (opcional)</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Teléfono (Yape/Plin, opcional)</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ej: 987654321"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    color: 'white'
                                }}
                            />
                        </div>
                        <Button type="submit" loading={loading} fullWidth>
                            Guardar Cambios
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    )
}

export default ProfileModal
