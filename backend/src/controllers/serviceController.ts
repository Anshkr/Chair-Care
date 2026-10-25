import { Request, Response } from 'express';
import { query } from '../config/database';

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, code, title, description, estimated_price, duration_minutes, badge, image_url, icon
       FROM services
       WHERE is_active = TRUE
       ORDER BY estimated_price ASC;`
    );

    res.json({
      success: true,
      data: (result?.rows || []).map((row) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        estimatedPrice: Number(row.estimated_price),
        durationMinutes: row.duration_minutes,
        badge: row.badge,
        imageUrl: row.image_url,
        icon: row.icon || 'Wrench',
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service catalogue.',
    });
  }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, code, title, description, estimated_price, duration_minutes, badge, image_url, icon
       FROM services
       WHERE (id::text = $1 OR code = $1) AND is_active = TRUE;`,
      [id]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Service not found.',
      });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        estimatedPrice: Number(row.estimated_price),
        durationMinutes: row.duration_minutes,
        badge: row.badge,
        imageUrl: row.image_url,
        icon: row.icon || 'Wrench',
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service details.',
    });
  }
};
