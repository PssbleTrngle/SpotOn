import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
   roots: ['<rootDir>'],
   moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
   testPathIgnorePatterns: ['<rootDir>[/\\\\](node_modules|.next)[/\\\\]'],
   transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(ts|tsx)$'],
   transform: {
      '^.+\\.(ts|tsx)$': 'babel-jest',
   },
   watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
   moduleNameMapper: {
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
      '\\.(gif|ttf|eot|svg|png)$': 'test-file-stub',
   },
   testEnvironment: 'node',
   setupFiles: ['<rootDir>/test/setup.ts'],
}

export default config
