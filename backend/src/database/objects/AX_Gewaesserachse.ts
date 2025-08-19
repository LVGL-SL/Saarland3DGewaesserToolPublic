import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('AX_Gewaesserachse')
export default class AXGewaesserachse {
    @PrimaryColumn()
    gmlid!: string;

    @Column()
    istteilvon!: string; 
    @Column({ nullable: true })   
    hatdirektunten?: string;
    
}
