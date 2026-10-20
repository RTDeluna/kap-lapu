import { directionsUrl } from '../directions';

describe('directionsUrl', () => {
  it('uses Apple Maps on iOS', () => {
    expect(directionsUrl(14.4333, 120.4833, 'Sisiman seawall', 'ios')).toBe(
      'maps:?daddr=14.433300,120.483300&q=Sisiman%20seawall',
    );
  });
  it('uses a geo intent on Android', () => {
    expect(directionsUrl(14.4333, 120.4833, 'Lusong area', 'android')).toBe(
      'geo:14.433300,120.483300?q=14.433300,120.483300(Lusong%20area)',
    );
  });
  it('falls back to Google Maps on the web', () => {
    expect(directionsUrl(14.4333, 120.4833, 'x', 'web')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=14.433300,120.483300',
    );
  });
});
