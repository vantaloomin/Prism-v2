# Aethel Saga - Audio Reference

All audio assets organized by location. Files are in `public/assets/audio/`.

## File Structure

Voice lines are duplicated for both avatar genders:
- **Female**: `public/assets/audio/voice/female/[path]`
- **Male**: `public/assets/audio/voice/male/[path]`

---

# Sound Effects (SFX)

## RPS Elements
| File | Ideal Sound Description |
|------|------------------------|
| `games/rps/sfx/element_fire.mp3` | Whooshing flame burst, crackling fire sound ~0.5s |
| `games/rps/sfx/element_water.mp3` | Splashing water, wave crash or drip sound ~0.5s |
| `games/rps/sfx/element_earth.mp3` | Rumbling earth, stone grinding or impact ~0.5s |

## Pack Opening
| File | Ideal Sound Description |
|------|------------------------|
| `sfx/pack_burst.mp3` | Magical burst/explosion when pack opens, sparkle overlay ~0.8s |
| `sfx/card_flip.mp3` | Crisp card flip/whoosh sound ~0.3s |
| `sfx/card_reveal_common.mp3` | Subtle chime, soft reveal ~0.4s |
| `sfx/card_reveal_rare.mp3` | Brighter chime, slight shimmer ~0.5s |
| `sfx/card_reveal_legendary.mp3` | Epic stinger with reverb, triumphant reveal ~1.5s |

## UI Interactions
| File | Ideal Sound Description |
|------|------------------------|
| `sfx/button_click.mp3` | Soft click/tap, satisfying feedback ~0.1s |
| `sfx/button_hover.mp3` | Very subtle hover effect, light whoosh ~0.1s |
| `ui/modal_open.mp3` | Soft slide-in or pop sound ~0.3s |
| `ui/modal_close.mp3` | Soft slide-out or dismiss sound ~0.2s |
| `ui/tab_switch.mp3` | Quick tab change click ~0.15s |

## Blackjack (Dragon's Hand)
| File | Ideal Sound Description |
|------|------------------------|
| `games/blackjack/sfx/card_deal.mp3` | Card sliding on felt, dealt snap ~0.3s |
| `games/blackjack/sfx/chip_stack.mp3` | Casino chips clinking together ~0.4s |
| `games/blackjack/sfx/win.mp3` | Victory fanfare, coins/gems sound ~0.8s |
| `games/blackjack/sfx/lose.mp3` | Sad trombone or deflating sound ~0.6s |

## Rune Stones (TTT)
| File | Ideal Sound Description |
|------|------------------------|
| `games/ttt/sfx/place_piece.mp3` | Stone placing on tablet, mystical thud ~0.4s |
| `games/ttt/sfx/win.mp3` | Triumphant mystical chime, rune glow sound ~0.8s |
| `games/ttt/sfx/draw.mp3` | Neutral mystical hum, stalemate tone ~0.6s |

## Background Music (BGM)
| File | Ideal Sound Description |
|------|------------------------|
| `bgm/main_theme.mp3` | Epic orchestral fantasy theme, loop-friendly ~2-3min |
| `bgm/arcade_loop.mp3` | Upbeat chiptune/synth arcade vibes, loops ~1-2min |
| `bgm/collection_ambient.mp3` | Calm, ambient pads, subtle fantasy feel ~2-3min |

---

# Voiceover Lines

## Game Selection
| File | Dialogue |
|------|----------|
| `games/selection/select_game.mp3` | "Select a game to play." |
| `games/selection/wizard_duel_hover.mp3` | "Fire, Water, Earth - master the elements!" |
| `games/selection/rune_stones_hover.mp3` | "Align ancient runes on the stone tablet!" |
| `games/selection/dragons_hand_hover.mp3` | "Beat the dealer to 21!" |

## Wizard Duel (RPS)
| File | Dialogue |
|------|----------|
| `games/rps/difficulty_normal.mp3` | "Normal mode! Choose your element wisely, challenger!" |
| `games/rps/difficulty_hard.mp3` | "Hard mode! Choose your element wisely, challenger!" |
| `games/rps/difficulty_hell.mp3` | "Hell mode! Choose your element wisely, challenger!" |
| `games/rps/player_chose_fire.mp3` | "You chose Fire! Let me think..." |
| `games/rps/player_chose_water.mp3` | "You chose Water! Let me think..." |
| `games/rps/player_chose_earth.mp3` | "You chose Earth! Let me think..." |
| `games/rps/ai_chose_fire.mp3` | "I choose Fire!" |
| `games/rps/ai_chose_water.mp3` | "I choose Water!" |
| `games/rps/ai_chose_earth.mp3` | "I choose Earth!" |
| `games/rps/player_wins.mp3` | "[Element] beats [Element]! You win!" |
| `games/rps/player_wins_streak.mp3` | "[X]x streak!" |
| `games/rps/ai_wins.mp3` | "[Element] beats [Element]! I win! Better luck next time~" |
| `games/rps/draw.mp3` | "We both chose [Element]! It's a draw! Streak reset." |

## Rune Stones (TTT)
| File | Dialogue |
|------|----------|
| `games/ttt/place_rune.mp3` | "Place your rune wisely, seeker..." |
| `games/ttt/ai_thinking.mp3` | "The stars reveal..." |
| `games/ttt/ai_placed.mp3` | "The moon rises here." |
| `games/ttt/await_move.mp3` | "I await your move..." |
| `games/ttt/player_wins.mp3` | "Your alignment... impressive." |
| `games/ttt/ai_wins.mp3` | "The stars foretold this victory!" |
| `games/ttt/draw.mp3` | "A cosmic stalemate!" |

## Dragon's Hand (Blackjack)
| File | Dialogue |
|------|----------|
| `games/blackjack/dealing.mp3` | "Dealing cards..." |
| `games/blackjack/blackjack.mp3` | "Blackjack!" |
| `games/blackjack/hit_or_stand.mp3` | "Hit or Stand?" |
| `games/blackjack/player_bust.mp3` | "Bust! You went over 21." |
| `games/blackjack/player_21.mp3` | "21! Standing automatically." |
| `games/blackjack/dealer_turn.mp3` | "Dealer's turn..." |
| `games/blackjack/dealer_hits.mp3` | "Dealer hits..." |
| `games/blackjack/dealer_bust.mp3` | "Dealer busts! You win!" |
| `games/blackjack/player_wins.mp3` | "You win!" |
| `games/blackjack/dealer_wins.mp3` | "Dealer wins. Better luck next time!" |
| `games/blackjack/push.mp3` | "Push! It's a tie. Bet returned." |
| `games/blackjack/invalid_bet.mp3` | "Invalid bet amount!" |
| `games/blackjack/not_enough.mp3` | "You don't have enough credits!" |

## General UI
| File | Dialogue |
|------|----------|
| `welcome.mp3` | Welcome greeting |
| `pack_open.mp3` | Pack opening excitement line |
| `rare_pull.mp3` | Rare/legendary card reaction |
