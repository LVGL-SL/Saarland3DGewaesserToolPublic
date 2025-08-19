import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import AppDataSource from '../databasedfintion';

@Entity('water_vertex')
export default class WaterVertex {
    @PrimaryGeneratedColumn()
    id!:number

    //real Primary Key
    @Column({ type: 'double', name: 'x' })
    x!: number;

    @Column({ type: 'double', name: 'y'})
    y!: number;

    @Column({ type: 'double', name: 'z'})
    z!: number;
    
    @Column({ type: 'text' })
    ecef!: string;

    @BeforeInsert()
    async checkUniqueXYZ() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        
        const repository = AppDataSource.getRepository(WaterVertex);
          // Nur prüfen, ob ein Punkt mit exakt denselben Koordinaten existiert
        const existing = await repository.findOne({ 
            where: { 
                x: this.x, 
                y: this.y, 
            } 
        });
        
        if (existing) {
            throw new Error(`existiert bereits und kann nicht doppelt angelegt werden.`);
        }
    }


}
