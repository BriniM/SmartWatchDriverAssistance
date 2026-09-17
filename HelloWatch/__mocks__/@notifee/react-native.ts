export const AndroidImportance = {
  LOW: 2,
  HIGH: 4,
};

const notifee = {
  requestPermission: jest.fn().mockResolvedValue(true),
  createChannel: jest.fn().mockResolvedValue('default'),
  displayNotification: jest.fn().mockResolvedValue('notification-id'),
  registerForegroundService: jest.fn(),
  stopForegroundService: jest.fn().mockResolvedValue(undefined),
  onForegroundEvent: jest.fn().mockReturnValue(() => {}),
};

export default notifee;