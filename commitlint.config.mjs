/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'api', 'db', 'config', 'ci', 'deps', 'release', 'repo']],
    'scope-empty': [0],
  },
}
