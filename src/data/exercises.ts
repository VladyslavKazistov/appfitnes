import type { Equipment, Exercise, Pattern } from '../types'

export const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: 'dumbbells', label: 'Гантели' },
  { id: 'bench', label: 'Скамья' },
  { id: 'barbell', label: 'Гриф с блинами' },
  { id: 'mat', label: 'Коврик' },
]

export const PATTERN_LABEL: Record<Pattern, string> = {
  squat: 'Ноги (присед)',
  hinge: 'Задняя цепь (тяга)',
  lunge: 'Ноги (выпады)',
  hPush: 'Грудь (жим)',
  vPush: 'Плечи (жим)',
  hPull: 'Спина (тяга к поясу)',
  vPull: 'Спина (вертикальная тяга)',
  chestIso: 'Грудь (изоляция)',
  sideDelt: 'Средняя дельта',
  rearDelt: 'Задняя дельта',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  hamCurl: 'Бицепс бедра',
  quadIso: 'Квадрицепс (изоляция)',
  calves: 'Икры',
  core: 'Пресс / кор',
}

const ex = (e: Exercise) => e

export const EXERCISES: Exercise[] = [
  // ── Присед
  ex({ id: 'bb-squat', name: 'Приседания со штангой', pattern: 'squat', needs: ['barbell', 'rack'], load: 'barbell', compound: true, level: 2, tip: 'Спина нейтральная, колени по направлению носков, глубина — бедро параллельно полу или ниже.' }),
  ex({ id: 'leg-press', name: 'Жим ногами', pattern: 'squat', needs: ['machines'], load: 'machine', compound: true, level: 1 }),
  ex({ id: 'goblet-squat', name: 'Гоблет-присед с гантелью', pattern: 'squat', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1, tip: 'Держи гантель у груди, локти между коленями внизу.' }),
  ex({ id: 'kb-goblet-squat', name: 'Гоблет-присед с гирей', pattern: 'squat', needs: ['kettlebell'], load: 'kettlebell', compound: true, level: 1 }),
  ex({ id: 'bw-squat', name: 'Приседания с весом тела (медленно, 3 с вниз)', pattern: 'squat', needs: [], load: 'bodyweight', compound: true, level: 1 }),
  ex({ id: 'band-squat', name: 'Приседания с резинкой', pattern: 'squat', needs: ['bands'], load: 'band', compound: true, level: 1 }),

  // ── Тяга / задняя цепь
  ex({ id: 'bb-rdl', name: 'Румынская тяга с грифом', pattern: 'hinge', needs: ['barbell'], load: 'barbell', compound: true, level: 2, tip: 'Таз назад, штанга скользит по бёдрам, лёгкий сгиб в коленях.' }),
  ex({ id: 'bb-deadlift', name: 'Становая тяга', pattern: 'hinge', needs: ['barbell'], load: 'barbell', compound: true, level: 3 }),
  ex({ id: 'db-rdl', name: 'Румынская тяга с гантелями', pattern: 'hinge', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'kb-swing', name: 'Махи гирей', pattern: 'hinge', needs: ['kettlebell'], load: 'kettlebell', compound: true, level: 2 }),
  ex({ id: 'hip-thrust-bench', name: 'Ягодичный мост с опорой на скамью', pattern: 'hinge', needs: ['bench'], load: 'bodyweight', compound: true, level: 1 }),
  ex({ id: 'sl-glute-bridge', name: 'Ягодичный мост на одной ноге', pattern: 'hinge', needs: [], load: 'bodyweight', compound: true, level: 1 }),
  ex({ id: 'band-pull-through', name: 'Протяжка резинки между ног', pattern: 'hinge', needs: ['bands'], load: 'band', compound: true, level: 1 }),

  // ── Выпады / одна нога
  ex({ id: 'db-split-squat', name: 'Болгарские выпады с гантелями', pattern: 'lunge', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: true, level: 2 }),
  ex({ id: 'db-lunge', name: 'Выпады с гантелями', pattern: 'lunge', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'bw-split-squat', name: 'Болгарские выпады с весом тела', pattern: 'lunge', needs: [], load: 'bodyweight', compound: true, level: 1, tip: 'Задняя нога на стуле или диване.' }),
  ex({ id: 'bw-lunge', name: 'Выпады назад', pattern: 'lunge', needs: [], load: 'bodyweight', compound: true, level: 1 }),

  // ── Горизонтальный жим
  ex({ id: 'bb-bench', name: 'Жим штанги лёжа', pattern: 'hPush', needs: ['barbell', 'bench', 'rack'], load: 'barbell', compound: true, level: 2, tip: 'Лопатки сведены, стопы в пол, штанга опускается на низ груди.' }),
  ex({ id: 'db-bench', name: 'Жим гантелей лёжа', pattern: 'hPush', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'db-incline', name: 'Жим гантелей на наклонной', pattern: 'hPush', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'db-floor-press', name: 'Жим гантелей лёжа на полу', pattern: 'hPush', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1, tip: 'Если нет скамьи: локти касаются пола, пауза, жим вверх.' }),
  ex({ id: 'machine-chest', name: 'Жим в тренажёре на грудь', pattern: 'hPush', needs: ['machines'], load: 'machine', compound: true, level: 1 }),
  ex({ id: 'dips', name: 'Отжимания на брусьях', pattern: 'hPush', needs: ['dipBars'], load: 'bodyweight', compound: true, level: 2 }),
  ex({ id: 'pushup', name: 'Отжимания от пола', pattern: 'hPush', needs: [], load: 'bodyweight', compound: true, level: 1 }),
  ex({ id: 'deficit-pushup', name: 'Отжимания с упорами (глубокие)', pattern: 'hPush', needs: [], load: 'bodyweight', compound: true, level: 2, tip: 'Руки на книгах или стульях, чтобы грудь опускалась ниже кистей.' }),

  // ── Вертикальный жим
  ex({ id: 'bb-ohp', name: 'Жим грифа стоя', pattern: 'vPush', needs: ['barbell'], load: 'barbell', compound: true, level: 2 }),
  ex({ id: 'db-ohp', name: 'Жим гантелей сидя', pattern: 'vPush', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'kb-press', name: 'Жим гири одной рукой', pattern: 'vPush', needs: ['kettlebell'], load: 'kettlebell', compound: true, level: 2 }),
  ex({ id: 'machine-shoulder', name: 'Жим в тренажёре на плечи', pattern: 'vPush', needs: ['machines'], load: 'machine', compound: true, level: 1 }),
  ex({ id: 'pike-pushup', name: 'Отжимания «пайк» (уголком)', pattern: 'vPush', needs: [], load: 'bodyweight', compound: true, level: 2 }),
  ex({ id: 'band-ohp', name: 'Жим резинки вверх', pattern: 'vPush', needs: ['bands'], load: 'band', compound: true, level: 1 }),

  // ── Горизонтальная тяга
  ex({ id: 'bb-row', name: 'Тяга грифа в наклоне', pattern: 'hPull', needs: ['barbell'], load: 'barbell', compound: true, level: 2 }),
  ex({ id: 'db-row', name: 'Тяга гантели одной рукой', pattern: 'hPull', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'cable-row', name: 'Горизонтальная тяга блока', pattern: 'hPull', needs: ['cable'], load: 'machine', compound: true, level: 1 }),
  ex({ id: 'kb-row', name: 'Тяга гири в наклоне', pattern: 'hPull', needs: ['kettlebell'], load: 'kettlebell', compound: true, level: 1 }),
  ex({ id: 'band-row', name: 'Тяга резинки к поясу', pattern: 'hPull', needs: ['bands'], load: 'band', compound: true, level: 1 }),
  ex({ id: 'table-row', name: 'Австралийские подтягивания (под столом)', pattern: 'hPull', needs: [], load: 'bodyweight', compound: true, level: 1, tip: 'Нужен крепкий стол. Корпус прямой, тянешь грудь к краю.' }),

  // ── Вертикальная тяга
  ex({ id: 'pullup', name: 'Подтягивания', pattern: 'vPull', needs: ['pullupBar'], load: 'bodyweight', compound: true, level: 2 }),
  ex({ id: 'chinup', name: 'Подтягивания обратным хватом', pattern: 'vPull', needs: ['pullupBar'], load: 'bodyweight', compound: true, level: 2 }),
  ex({ id: 'lat-pulldown', name: 'Тяга верхнего блока', pattern: 'vPull', needs: ['cable'], load: 'machine', compound: true, level: 1 }),
  ex({ id: 'band-pulldown', name: 'Тяга резинки сверху', pattern: 'vPull', needs: ['bands'], load: 'band', compound: true, level: 1 }),
  ex({ id: 'db-pullover', name: 'Пуловер с гантелью', pattern: 'vPull', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: false, level: 1 }),

  // ── Изоляция
  ex({ id: 'db-fly', name: 'Разводка гантелей лёжа', pattern: 'chestIso', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'cable-fly', name: 'Сведение рук в кроссовере', pattern: 'chestIso', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'pec-deck', name: 'Бабочка (пек-дек)', pattern: 'chestIso', needs: ['machines'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'band-fly', name: 'Сведение рук с резинкой', pattern: 'chestIso', needs: ['bands'], load: 'band', compound: false, level: 1 }),

  ex({ id: 'db-lateral', name: 'Махи гантелями в стороны', pattern: 'sideDelt', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'cable-lateral', name: 'Отведение руки в блоке', pattern: 'sideDelt', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'band-lateral', name: 'Махи с резинкой в стороны', pattern: 'sideDelt', needs: ['bands'], load: 'band', compound: false, level: 1 }),

  ex({ id: 'db-rear-fly', name: 'Разводка в наклоне на заднюю дельту', pattern: 'rearDelt', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'face-pull', name: 'Тяга каната к лицу', pattern: 'rearDelt', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'band-pull-apart', name: 'Разведение резинки перед собой', pattern: 'rearDelt', needs: ['bands'], load: 'band', compound: false, level: 1 }),
  ex({ id: 'prone-ytw', name: 'Y-T-W лёжа на животе', pattern: 'rearDelt', needs: [], load: 'bodyweight', compound: false, level: 1 }),

  ex({ id: 'bb-curl', name: 'Подъём грифа на бицепс', pattern: 'biceps', needs: ['barbell'], load: 'barbell', compound: false, level: 1 }),
  ex({ id: 'db-curl', name: 'Подъём гантелей на бицепс', pattern: 'biceps', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'hammer-curl', name: 'Молотки с гантелями', pattern: 'biceps', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'cable-curl', name: 'Сгибания рук в блоке', pattern: 'biceps', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'band-curl', name: 'Сгибания рук с резинкой', pattern: 'biceps', needs: ['bands'], load: 'band', compound: false, level: 1 }),
  ex({ id: 'towel-curl', name: 'Сгибания с полотенцем (изометрия)', pattern: 'biceps', needs: [], load: 'bodyweight', compound: false, level: 1, timed: true, tip: 'Наступи на полотенце и тяни изо всех сил, 20–40 секунд.' }),

  ex({ id: 'db-oh-ext', name: 'Французский жим гантели из-за головы', pattern: 'triceps', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'bb-skull', name: 'Французский жим грифа лёжа', pattern: 'triceps', needs: ['barbell', 'bench'], load: 'barbell', compound: false, level: 2 }),
  ex({ id: 'cable-pushdown', name: 'Разгибания рук в блоке', pattern: 'triceps', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'band-pushdown', name: 'Разгибания рук с резинкой', pattern: 'triceps', needs: ['bands'], load: 'band', compound: false, level: 1 }),
  ex({ id: 'diamond-pushup', name: 'Отжимания узким хватом', pattern: 'triceps', needs: [], load: 'bodyweight', compound: false, level: 1 }),
  ex({ id: 'bench-dip', name: 'Обратные отжимания от скамьи', pattern: 'triceps', needs: ['bench'], load: 'bodyweight', compound: false, level: 1 }),

  ex({ id: 'bb-close-press', name: 'Жим грифа узким хватом лёжа', pattern: 'triceps', needs: ['barbell', 'bench'], load: 'barbell', compound: false, level: 1, tip: 'Хват на ширине плеч, локти вдоль корпуса.' }),
  ex({ id: 'bb-reverse-curl', name: 'Подъём грифа обратным хватом', pattern: 'biceps', needs: ['barbell'], load: 'barbell', compound: false, level: 1 }),
  ex({ id: 'db-incline-curl', name: 'Сгибания с гантелями сидя на наклонной', pattern: 'biceps', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'db-chest-row', name: 'Тяга гантелей лёжа грудью на наклонной скамье', pattern: 'hPull', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'db-arnold', name: 'Жим Арнольда', pattern: 'vPush', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'db-upright-row', name: 'Тяга гантелей к подбородку (широко)', pattern: 'sideDelt', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'db-step-up', name: 'Зашагивания на скамью с гантелями', pattern: 'lunge', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: true, level: 1 }),
  ex({ id: 'db-sl-rdl', name: 'Румынская тяга на одной ноге с гантелями', pattern: 'hinge', needs: ['dumbbells'], load: 'dumbbell', compound: true, level: 2, tip: 'При лёгких гантелях работа на одной ноге даёт мышцам достаточную нагрузку.' }),
  ex({ id: 'leg-curl', name: 'Сгибания ног в тренажёре', pattern: 'hamCurl', needs: ['machines'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'db-leg-curl', name: 'Сгибания ног с гантелью лёжа', pattern: 'hamCurl', needs: ['dumbbells', 'bench'], load: 'dumbbell', compound: false, level: 2 }),
  ex({ id: 'slider-curl', name: 'Сгибания ног на скользящих (полотенце на полу)', pattern: 'hamCurl', needs: [], load: 'bodyweight', compound: false, level: 2 }),

  ex({ id: 'leg-ext', name: 'Разгибания ног в тренажёре', pattern: 'quadIso', needs: ['machines'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'sissy-squat', name: 'Сисси-присед с опорой', pattern: 'quadIso', needs: [], load: 'bodyweight', compound: false, level: 2 }),

  ex({ id: 'db-calf', name: 'Подъёмы на носки с гантелью', pattern: 'calves', needs: ['dumbbells'], load: 'dumbbell', compound: false, level: 1 }),
  ex({ id: 'machine-calf', name: 'Подъёмы на носки в тренажёре', pattern: 'calves', needs: ['machines'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'bw-calf', name: 'Подъёмы на носки на одной ноге', pattern: 'calves', needs: [], load: 'bodyweight', compound: false, level: 1 }),

  ex({ id: 'hanging-raise', name: 'Подъёмы ног в висе', pattern: 'core', needs: ['pullupBar'], load: 'bodyweight', compound: false, level: 2 }),
  ex({ id: 'cable-crunch', name: 'Скручивания в блоке', pattern: 'core', needs: ['cable'], load: 'machine', compound: false, level: 1 }),
  ex({ id: 'plank', name: 'Планка', pattern: 'core', needs: [], load: 'bodyweight', compound: false, level: 1, timed: true }),
  ex({ id: 'dead-bug', name: 'Мёртвый жук', pattern: 'core', needs: [], load: 'bodyweight', compound: false, level: 1 }),
  ex({ id: 'crunch', name: 'Скручивания лёжа', pattern: 'core', needs: [], load: 'bodyweight', compound: false, level: 1 }),
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise {
  return EXERCISE_BY_ID[id] ?? { id, name: id, pattern: 'core', needs: [], load: 'bodyweight', compound: false, level: 1 }
}
