import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { Img } from './Img';
import { ProductTags } from './ui';
import { productImage } from '../lib/links';
import { priceLabel } from '../lib/rules';

export function ProductCard({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const to = `/product/${product.slug}`;
  return (
    <article className={`product-card ${product.soldOut ? 'is-sold-out' : ''}`}>
      <div className="product-card-media">
        <Img src={productImage(product.slug)} alt={product.name} width={600} height={600} />
        {product.soldOut && <span className="sold-out-label">Sold out</span>}
      </div>
      <div className="product-card-body">
        <ProductTags product={product} compact />
        <H className="product-card-title">{product.name}</H>
        <p className="product-card-price">{priceLabel(product)}</p>
        <Link to={to} className="btn btn-primary btn-sm btn-block" aria-label={`View ${product.name}`}>
          View
        </Link>
      </div>
    </article>
  );
}
