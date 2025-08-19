import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('AX_Wasserlauf')
export default class AXWasserlauf {
    @PrimaryColumn()
    gmlid!: string;

    @Column()
    name!: string;

    @Column({ type: 'bigint' })
    gewaesserkennzahl!: number;

}
