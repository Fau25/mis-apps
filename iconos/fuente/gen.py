DEFS = '''<defs>
<linearGradient id="cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C7C7D1"/></linearGradient>
<linearGradient id="cm" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#E6E6EC"/><stop offset="1" stop-color="#8E8E9B"/></linearGradient>
<linearGradient id="co" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#9E9EAB"/><stop offset="1" stop-color="#4C4C58"/></linearGradient>
<linearGradient id="cv" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#F8F8FB" stop-opacity=".96"/><stop offset="1" stop-color="#B4B4C0" stop-opacity=".9"/></linearGradient>
<linearGradient id="br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<filter id="so" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2.6" flood-color="#2A2C3C" flood-opacity=".22"/></filter>
<filter id="de" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
</defs>'''
def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">{DEFS}{body}</svg>'

I = {}
# Mi Día · calendario
dots = ''.join(f'<circle cx="{x}" cy="{y}" r="2.3" fill="#FFFFFF" opacity=".9"/>' for y in (35,42,49) for x in (21,28.5,36,43.5))
I['dia'] = svg(f'''<rect x="10" y="13" width="44" height="43" rx="11" fill="url(#cm)"/>
<path d="M21 13h22a11 11 0 0 1 11 11v2H10v-2a11 11 0 0 1 11-11z" fill="url(#co)"/>
{dots}
<rect x="10.6" y="13.6" width="42.8" height="41.8" rx="10.4" fill="none" stroke="url(#br)" stroke-width="1.2"/>
<rect x="20" y="7" width="6" height="13" rx="3" fill="url(#cl)"/><rect x="38" y="7" width="6" height="13" rx="3" fill="url(#cl)"/>''')
# Hábitos · check
I['habitos'] = svg('''<circle cx="31" cy="34" r="21" fill="url(#cv)"/>
<circle cx="31" cy="34" r="20.4" fill="none" stroke="url(#br)" stroke-width="1.2"/>
<path d="M21.5 34.5l6.5 6.5 13.5-14" fill="none" stroke="url(#co)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>''')
# Mi Compra · bolsa
I['compra'] = svg('''<path d="M20 22h26l4 30a5 5 0 0 1-5 5H24" fill="url(#co)" opacity=".7"/>
<path d="M16 24h30l3 27a6 6 0 0 1-6 6.5H19a6 6 0 0 1-6-6.5z" fill="url(#cv)"/>
<path d="M16.6 24.6h28.8" stroke="url(#br)" stroke-width="1.4"/>
<path d="M23 29v-8a8 8 0 0 1 16 0v8" fill="none" stroke="url(#co)" stroke-width="3.6" stroke-linecap="round"/>''')
# Mi Mascota · huella
I['mascota'] = svg('''<path d="M32 33c-8 0-15 8-15 14 0 5 4 8 9 7 3-.6 4-1.5 6-1.5s3 .9 6 1.5c5 1 9-2 9-7 0-6-7-14-15-14z" fill="url(#cm)"/>
<path d="M32 33.8c-7 0-13.6 7.4-14.2 12.8" fill="none" stroke="url(#br)" stroke-width="1.2"/>
<ellipse cx="16" cy="29" rx="5.2" ry="6.6" transform="rotate(-20 16 29)" fill="url(#cl)"/>
<ellipse cx="25.5" cy="18.5" rx="5.2" ry="7" transform="rotate(-8 25.5 18.5)" fill="url(#co)"/>
<ellipse cx="38.5" cy="18.5" rx="5.2" ry="7" transform="rotate(8 38.5 18.5)" fill="url(#co)"/>
<ellipse cx="48" cy="29" rx="5.2" ry="6.6" transform="rotate(20 48 29)" fill="url(#cl)"/>''')
# Mis viajes · maleta
I['viajes'] = svg('''<path d="M25 20v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="none" stroke="url(#co)" stroke-width="3.6"/>
<rect x="11" y="19" width="42" height="36" rx="10" fill="url(#cv)"/>
<rect x="11.6" y="19.6" width="40.8" height="34.8" rx="9.4" fill="none" stroke="url(#br)" stroke-width="1.2"/>
<rect x="21" y="19" width="5" height="36" fill="url(#co)" opacity=".85"/><rect x="38" y="19" width="5" height="36" fill="url(#co)" opacity=".85"/>
<circle cx="18" cy="58" r="2.6" fill="url(#co)"/><circle cx="46" cy="58" r="2.6" fill="url(#co)"/>''')
# Mis Tickets · recibo
zz = 'M14 10h30a4 4 0 0 1 4 4v40l-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-3 2V14a4 4 0 0 1 4-4z'
I['tickets'] = svg(f'''<path d="{zz}" transform="translate(6 2)" fill="url(#co)" opacity=".7"/>
<path d="{zz}" fill="url(#cv)"/>
<path d="M14.6 10.6h29" stroke="url(#br)" stroke-width="1.4"/>
<rect x="18" y="20" width="20" height="3.4" rx="1.7" fill="url(#co)"/><rect x="18" y="29" width="24" height="3.4" rx="1.7" fill="url(#cm)"/>
<rect x="18" y="38" width="14" height="3.4" rx="1.7" fill="url(#cm)"/>''')
# Mis pedidos · caja
I['pedidos'] = svg('''<path d="M32 8l22 11-22 11-22-11z" fill="url(#cl)"/>
<path d="M10 19l22 11v26L10 45z" fill="url(#cm)"/>
<path d="M54 19L32 30v26l22-11z" fill="url(#co)"/>
<path d="M21 13.5l22 11v8l-5 2.5v-8l-22-11z" fill="#FFFFFF" opacity=".75"/>
<path d="M32 30v26" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1"/>''')
# Pronósticos · barras
I['pronos'] = svg('''<rect x="11" y="34" width="12" height="22" rx="5" fill="url(#cl)"/>
<rect x="26" y="22" width="12" height="34" rx="5" fill="url(#cm)"/>
<rect x="41" y="10" width="12" height="46" rx="5" fill="url(#co)"/>
<rect x="41.6" y="10.6" width="10.8" height="20" rx="4.4" fill="url(#br)" opacity=".5"/>''')
import os
os.makedirs('svg', exist_ok=True)
for k,v in I.items(): open(f'svg/{k}.svg','w').write(v)
nombres = dict(dia='Mi Día',habitos='Hábitos',compra='Mi Compra',mascota='Mi Mascota',viajes='Mis viajes',tickets='Mis Tickets',pedidos='Mis pedidos',pronos='Pronósticos')
celdas = ''.join(f'<div class="c"><img src="svg/{k}.svg"><span>{nombres[k]}</span></div>' for k in I)
open('muestra.html','w').write(f'''<!doctype html><meta charset=utf-8><style>body{{margin:0;background:#E9E9EE;font:600 13px sans-serif;color:#555}}
.f{{display:flex;gap:18px;padding:30px}}.c{{width:120px;height:130px;background:#fff;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-shadow:0 10px 26px rgba(40,42,60,.07)}}
img{{width:60px;height:60px}}</style><div class="f">{celdas}</div>''')
