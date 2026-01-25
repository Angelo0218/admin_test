import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const userAvatarPath = path.join(root, 'src/layouts/components/UserAvatar.vue')
const normalHeaderPath = path.join(root, 'src/layouts/normal/header/index.vue')
const fullHeaderPath = path.join(root, 'src/layouts/full/header/index.vue')
const componentsIndexPath = path.join(root, 'src/layouts/components/index.ts')

const languageSelectPath = path.join(root, 'src/layouts/components/LanguageSelect.vue')

const [userAvatar, normalHeader, fullHeader, componentsIndex, languageSelect] = await Promise.all([
  readFile(userAvatarPath, 'utf8'),
  readFile(normalHeaderPath, 'utf8'),
  readFile(fullHeaderPath, 'utf8'),
  readFile(componentsIndexPath, 'utf8'),
  readFile(languageSelectPath, 'utf8'),
])

const userAvatarHasLanguage = /switchLanguage|common\.switchLanguage|languageLabel/.test(userAvatar)
const normalHeaderHasLanguage = /LanguageSelect/.test(normalHeader)
const fullHeaderHasLanguage = /LanguageSelect/.test(fullHeader)
const indexHasLanguage = /LanguageSelect/.test(componentsIndex)
const languageSelectHasToast = /\$message\./.test(languageSelect)

if (userAvatarHasLanguage || !normalHeaderHasLanguage || !fullHeaderHasLanguage || !indexHasLanguage || languageSelectHasToast) {
  if (userAvatarHasLanguage)
    console.error('UserAvatar still contains language switch option.')
  if (!normalHeaderHasLanguage)
    console.error('Normal header missing LanguageSelect.')
  if (!fullHeaderHasLanguage)
    console.error('Full header missing LanguageSelect.')
  if (!indexHasLanguage)
    console.error('components/index.js missing LanguageSelect export.')
  if (languageSelectHasToast)
    console.error('LanguageSelect should not show toast.')
  process.exit(1)
}

console.log('ok')
