jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    withTransactionSync: jest.fn((cb) => cb()),
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      executeForRawResultSync: jest.fn(() => ({
        getFirstSync: jest.fn(),
        getAllSync: jest.fn(() => []),
        getColumnNamesSync: jest.fn(() => []),
      })),
      getAllSync: jest.fn(() => []),
    })),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
