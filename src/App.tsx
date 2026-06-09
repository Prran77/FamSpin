import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type MemberType = 'adult' | 'kid'

type Member = {
  id: string
  type: MemberType
  name: string
  defaultName: string
}

type Category = {
  id: string
  name: string
  options: string[]
  custom?: boolean
}

type Votes = Record<string, string>

type ViewState = 'home' | 'voting' | 'summary' | 'spin' | 'result'

const STORAGE_MEMBERS = 'famspin-members'
const STORAGE_CATEGORIES = 'famspin-categories'

const DEFAULT_MEMBERS: Member[] = [
  { id: 'member-1', type: 'adult', name: '', defaultName: 'Parent 1' },
  { id: 'member-2', type: 'adult', name: '', defaultName: 'Parent 2' },
  { id: 'member-3', type: 'kid', name: '', defaultName: 'Kid 1' },
  { id: 'member-4', type: 'kid', name: '', defaultName: 'Kid 2' }
]

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'dinner',
    name: 'Dinner',
    options: ['Pizza', 'Tacos', 'Pasta', 'Burgers', 'Sushi', 'Stir Fry', 'Curry']
  },
  {
    id: 'weekend',
    name: 'Weekend Activity',
    options: ['Hiking', 'Cinema', 'Park Picnic', 'Swimming', 'Day Trip', 'Stay Home']
  },
  {
    id: 'board',
    name: 'Board Game Night',
    options: ['Uno', 'Monopoly', 'Pick Your Poison', 'Catan', 'Jenga', 'Trivial Pursuit']
  },
  {
    id: 'movie',
    name: 'Movie Night',
    options: ['Action', 'Comedy', 'Animated', 'Horror', 'Documentary', 'Family Pick']
  },
  {
    id: 'sport',
    name: 'Sport',
    options: ['Football', 'Badminton', 'Cycling', 'Swimming', 'Tennis', 'Just a Walk']
  }
]

const NEON_COLORS = ['#ff3d99', '#4dffff', '#9dff4d', '#ff9a3d', '#ce7dff', '#46ffc8', '#ff4dca', '#4d89ff']

const createId = () => crypto.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`

const defaultNameForType = (members: Member[], type: MemberType) => {
  const count = members.filter((member) => member.type === type).length + 1
  return type === 'adult' ? `Parent ${count}` : `Kid ${count}`
}

const displayName = (member: Member) => member.name.trim() || member.defaultName

export default function App() {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS)
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>('home')
  const [votes, setVotes] = useState<Votes>({})
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryOption, setNewCategoryOption] = useState('')
  const [newCategoryOptions, setNewCategoryOptions] = useState<string[]>([])
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [confettiKey, setConfettiKey] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const spinTimer = useRef<number | null>(null)

  useEffect(() => {
    try {
      const savedMembers = JSON.parse(localStorage.getItem(STORAGE_MEMBERS) ?? 'null') as Member[] | null
      const savedCategories = JSON.parse(localStorage.getItem(STORAGE_CATEGORIES) ?? 'null') as Category[] | null

      if (savedMembers?.length) {
        setMembers(savedMembers)
      }
      if (savedCategories?.length) {
        setCategories(savedCategories)
      }
    } catch (error) {
      console.warn('Unable to load saved Family Spinner data.', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_MEMBERS, JSON.stringify(members))
  }, [members])

  useEffect(() => {
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories))
  }, [categories])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  )

  const currentVoter = useMemo(
    () => members.find((member) => !votes[member.id]) ?? null,
    [members, votes]
  )

  const allVoted = members.length > 0 && Object.keys(votes).length === members.length

  useEffect(() => {
    if (view === 'voting' && allVoted) {
      setView('summary')
    }
  }, [view, allVoted])

  useEffect(() => {
    return () => {
      if (spinTimer.current) {
        window.clearTimeout(spinTimer.current)
      }
    }
  }, [])

  const addMember = (type: MemberType) => {
    const newMember: Member = {
      id: createId(),
      type,
      name: '',
      defaultName: defaultNameForType(members, type)
    }
    setMembers((current) => [...current, newMember])
  }

  const updateMemberName = (id: string, name: string) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, name: name.trim() } : member
      )
    )
  }

  const startEditingMember = (member: Member) => {
    setEditingMemberId(member.id)
    setDraftName(member.name)
  }

  const commitMemberName = (member: Member) => {
    updateMemberName(member.id, draftName)
    setEditingMemberId(null)
    setDraftName('')
  }

  const addOptionToCategory = (categoryId: string, option: string) => {
    const value = option.trim()
    if (!value) return

    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? { ...category, options: [...category.options, value] }
          : category
      )
    )
    setOptionInputs((current) => ({ ...current, [categoryId]: '' }))
  }

  const addNewCategoryOption = () => {
    const value = newCategoryOption.trim()
    if (!value) return
    setNewCategoryOptions((current) => [...current, value])
    setNewCategoryOption('')
  }

  const createCustomCategory = () => {
    const name = newCategoryName.trim()
    if (!name || newCategoryOptions.length === 0) return

    const nextCategory: Category = {
      id: createId(),
      name,
      options: [...newCategoryOptions],
      custom: true
    }

    setCategories((current) => [...current, nextCategory])
    setNewCategoryName('')
    setNewCategoryOption('')
    setNewCategoryOptions([])
  }

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setVotes({})
    setWinner(null)
    setView('voting')
    setWheelRotation(0)
    setShowConfetti(false)
  }

  const recordVote = (option: string) => {
    if (!currentVoter) return
    const nextVotes = { ...votes, [currentVoter.id]: option }
    setVotes(nextVotes)
  }

  const startSpin = () => {
    if (!selectedCategory) return
    const optionCount = selectedCategory.options.length
    if (!optionCount) return

    const targetIndex = Math.floor(Math.random() * optionCount)
    const anglePerSlice = 360 / optionCount
    const extraRotations = 6
    const finalAngle = 360 * extraRotations + targetIndex * anglePerSlice + anglePerSlice / 2

    setWheelRotation(finalAngle)
    setIsSpinning(true)
    setView('spin')
    setWinner(null)
    setShowConfetti(false)

    if (spinTimer.current) {
      window.clearTimeout(spinTimer.current)
    }

    spinTimer.current = window.setTimeout(() => {
      setIsSpinning(false)
      const chosen = selectedCategory.options[targetIndex]
      setWinner(chosen)
      setShowConfetti(true)
      setConfettiKey((value) => value + 1)
    }, 5200)
  }

  const resetToHome = () => {
    setVotes({})
    setSelectedCategoryId(null)
    setView('home')
    setIsSpinning(false)
    setWheelRotation(0)
    setWinner(null)
    setShowConfetti(false)
  }

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: `${confettiKey}-${index}`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.6}s`,
        color: NEON_COLORS[index % NEON_COLORS.length],
        rotate: `${Math.floor(Math.random() * 360)}deg`
      })),
    [confettiKey]
  )

  return (
    <div className="app-shell">
      <div className="background-grid" aria-hidden="true" />
      <header className="topbar">
        <div>
          <p className="eyebrow">Family Spinner</p>
          <h1>Neon family decision maker</h1>
          <p className="subtitle">
            Vote as a family, then spin the festive wheel for a pure-luck winner.
          </p>
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={resetToHome}>
            Reset votes
          </button>
          <button className="ghost-button" onClick={() => setView('home')}>
            Categories
          </button>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel family-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Family setup</p>
              <h2>Who is choosing tonight?</h2>
            </div>
            <div className="member-buttons">
              <button className="mini-button" onClick={() => addMember('adult')}>
                + Add Adult
              </button>
              <button className="mini-button" onClick={() => addMember('kid')}>
                + Add Kid
              </button>
            </div>
          </div>

          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-card">
                <div>
                  <span className="member-badge">{member.type === 'adult' ? 'Adult' : 'Kid'}</span>
                  {editingMemberId === member.id ? (
                    <input
                      className="member-input"
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => commitMemberName(member)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          commitMemberName(member)
                        }
                      }}
                    />
                  ) : (
                    <button type="button" className="member-name" onClick={() => startEditingMember(member)}>
                      {displayName(member)}
                    </button>
                  )}
                </div>
                <div className="member-vote">
                  {votes[member.id] ? `Voted: ${votes[member.id]}` : 'Waiting...'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Categories</p>
              <h2>Pick what to decide</h2>
            </div>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-card-title">
                  <h3>{category.name}</h3>
                  {category.custom && <span className="custom-pill">Custom</span>}
                </div>
                <div className="option-pill-list">
                  {category.options.slice(0, 6).map((option) => (
                    <span key={option} className="option-pill">
                      {option}
                    </span>
                  ))}
                  {category.options.length > 6 && (
                    <span className="option-pill">+{category.options.length - 6}</span>
                  )}
                </div>
                <div className="category-actions">
                  <button className="category-button" onClick={() => selectCategory(category.id)}>
                    Start {category.name}
                  </button>
                </div>
                <div className="small-input-row">
                  <input
                    className="small-input"
                    placeholder="Add option"
                    value={optionInputs[category.id] ?? ''}
                    onChange={(event) =>
                      setOptionInputs((current) => ({ ...current, [category.id]: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        addOptionToCategory(category.id, optionInputs[category.id] ?? '')
                      }
                    }}
                  />
                  <button
                    className="mini-button"
                    onClick={() => addOptionToCategory(category.id, optionInputs[category.id] ?? '')}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="new-category-card">
            <div className="category-card-title">
              <h3>Fully custom category</h3>
            </div>
            <input
              className="wide-input"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <div className="tag-input-row">
              <input
                className="small-input"
                placeholder="New option"
                value={newCategoryOption}
                onChange={(event) => setNewCategoryOption(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    addNewCategoryOption()
                  }
                }}
              />
              <button className="mini-button" onClick={addNewCategoryOption}>
                Add option
              </button>
            </div>
            <div className="option-pill-list option-list-inline">
              {newCategoryOptions.map((option, index) => (
                <span key={`${option}-${index}`} className="option-pill custom-pill">
                  {option}
                </span>
              ))}
            </div>
            <button className="category-button" onClick={createCustomCategory}>
              Create custom category
            </button>
          </div>
        </section>
      </main>

      {view === 'voting' && selectedCategory && (
        <section className="panel voting-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Voting</p>
              <h2>{selectedCategory.name}</h2>
            </div>
            <button className="ghost-button" onClick={resetToHome}>
              Back to categories
            </button>
          </div>
          <div className="voting-grid">
            <div>
              <p className="voting-step">Current voter</p>
              <h3>{currentVoter ? displayName(currentVoter) : 'All done!'}</h3>
            </div>
            <div className="option-grid">
              {selectedCategory.options.map((option) => (
                <button key={option} className="option-card" type="button" onClick={() => recordVote(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'summary' && selectedCategory && (
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Summary</p>
              <h2>Who picked what</h2>
            </div>
          </div>
          <div className="summary-list">
            {members.map((member) => (
              <div key={member.id} className="summary-row">
                <span>{displayName(member)}</span>
                <strong>{votes[member.id] ?? 'No vote'}</strong>
              </div>
            ))}
          </div>
          <div className="summary-actions">
            <button className="spin-button" onClick={startSpin}>
              SPIN THE WHEEL!
            </button>
            <button className="ghost-button" onClick={resetToHome}>
              Change category
            </button>
          </div>
        </section>
      )}

      {view === 'spin' && selectedCategory && (
        <section className="panel spin-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Wheel</p>
              <h2>Spin for a winner</h2>
            </div>
          </div>
          <div className="wheel-stage">
            <div className="wheel-pointer" />
            <div
              className="wheel"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 5.2s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                background: `conic-gradient(${selectedCategory.options
                  .map((_, index) =>
                    `${NEON_COLORS[index % NEON_COLORS.length]} ${
                      (100 / selectedCategory.options.length) * index
                    }%, ${NEON_COLORS[index % NEON_COLORS.length]} ${
                      (100 / selectedCategory.options.length) * (index + 1)
                    }%`
                  )
                  .join(', ')})`
              }}
            >
              {selectedCategory.options.map((option, index) => {
                const angle = (360 / selectedCategory.options.length) * index
                return (
                  <div key={`${option}-${index}`} className="wheel-label" style={{ transform: `rotate(${angle}deg) translate(0, -150px)` }}>
                    <span style={{ transform: `rotate(${90 + 360 / selectedCategory.options.length / 2}deg)` }}>
                      {option}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="spin-actions">
            <button className="spin-button" onClick={startSpin} disabled={isSpinning}>
              {isSpinning ? 'Spinning...' : 'Spin again for luck'}
            </button>
            <button className="ghost-button" onClick={resetToHome}>
              Reset votes
            </button>
          </div>
        </section>
      )}

      {winner && (
        <div className="result-overlay">
          <div className="result-card">
            <p className="panel-label">Winner</p>
            <h2>{winner}</h2>
            <p className="result-copy">Pure luck decided the family choice 🎉</p>
            <button className="spin-button" onClick={resetToHome}>
              Spin again
            </button>
          </div>
          <div className="confetti-holder">
            {showConfetti &&
              confettiPieces.map((piece) => (
                <span
                  key={piece.id}
                  className="confetti-piece"
                  style={{
                    left: piece.left,
                    background: piece.color,
                    transform: `rotate(${piece.rotate})`,
                    animationDelay: piece.delay
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
