import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import AppDataSource from '../databasedfintion';

@Entity('water_path')
export default class WaterPath{
     @PrimaryGeneratedColumn()
    id!:number

   
    @Column({ type: 'double', name: 'from_x' })
    fromx!: number;

    @Column({ type: 'double', name: 'from_y'})
    fromy!: number;

    @Column()
    istteilvon!: string;

    @Column({ type: 'double', name: 'to_x' })
    tox!: number;

    @Column({ type: 'double', name: 'to_y'})
    toy!: number;

     @BeforeInsert()
    async checkUniqueXYZ() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        
        const repository = AppDataSource.getRepository(WaterPath);
        const existing = await repository.findOne({ 
            where: { 
                fromx: this.fromx, 
                fromy: this.fromy,
                istteilvon: this.istteilvon,
                tox: this.tox,
                toy: this.toy
            } 
        });
        
        if (existing) {
            throw new Error(`Existiert bereits und kann nicht doppelt angelegt werden.`);
        }
    }
 
}