import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>)
})

app.get('/api/turnos', (c) => {
  const sampleData = {
    turnos: [
      {
        id: 1,
        paciente: 'Juan Pérez',
        fecha: '2026-03-05',
        hora: '10:00',
        doctor: 'Dra. María González',
        especialidad: 'Cardiología',
        estado: 'confirmado'
      },
      {
        id: 2,
        paciente: 'Ana Martínez',
        fecha: '2026-03-05',
        hora: '11:30',
        doctor: 'Dr. Carlos Rodríguez',
        especialidad: 'Pediatría',
        estado: 'pendiente'
      },
      {
        id: 3,
        paciente: 'Roberto Silva',
        fecha: '2026-03-06',
        hora: '09:00',
        doctor: 'Dra. Laura Fernández',
        especialidad: 'Dermatología',
        estado: 'confirmado'
      }
    ],
    total: 3
  }
  
  return c.json(sampleData)
})

export default app
