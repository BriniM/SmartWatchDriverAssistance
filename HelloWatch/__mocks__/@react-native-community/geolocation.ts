const geolocation = {
  getCurrentPosition: jest.fn(success => {
    success({
      coords: {
        latitude: 37.4219983,
        longitude: -122.084,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(success => success()),
  setRNConfiguration: jest.fn(),
};

export default geolocation;